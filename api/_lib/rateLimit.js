// Fixed-window rate limiter.
//
// With UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN set (Vercel Marketplace →
// Upstash), counts are shared by every function instance. Without them it falls
// back to a per-instance in-memory counter: weaker (each warm instance counts on
// its own) but never blocks a legitimate request because of missing config.

const memory = new Map();

function memoryHit(key, windowSec, now) {
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    if (memory.size > 5000) {
      for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
    }
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

async function upstashHit(key, windowSec, { url, token, fetchImpl }) {
  const res = await fetchImpl(`${url.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([['INCR', key], ['EXPIRE', key, String(windowSec), 'NX']]),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const [incr] = await res.json();
  return Number(incr.result);
}

function createRateLimiter({ env = process.env, fetchImpl = globalThis.fetch, now = Date.now, logger = console } = {}) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  return {
    shared: Boolean(url && token),
    // Returns { allowed, count }. A limiter outage fails open to the in-memory counter.
    async hit(key, limit, windowSec) {
      const bucket = `rl:${key}:${Math.floor(now() / (windowSec * 1000))}`;
      let count;
      if (url && token) {
        try {
          count = await upstashHit(bucket, windowSec, { url, token, fetchImpl });
        } catch (err) {
          logger.error('rate limiter unavailable, using in-memory fallback:', err.message);
        }
      }
      if (count === undefined) count = memoryHit(bucket, windowSec, now());
      return { allowed: count <= limit, count };
    },
  };
}

module.exports = { createRateLimiter, _memory: memory };
