// Cloudflare Turnstile verification. Enabled only when TURNSTILE_SECRET_KEY is set;
// the matching TURNSTILE_SITE_KEY is served to the page by /api/public-config.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function createTurnstile({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const secret = env.TURNSTILE_SECRET_KEY;
  return {
    enabled: Boolean(secret),
    // Resolves to true (human), false (rejected) or throws when Cloudflare is unreachable.
    async verify(token, ip) {
      if (!secret) return false;
      if (!token || typeof token !== 'string' || token.length > 2048) return false;
      const form = new URLSearchParams({ secret, response: token });
      if (ip && ip !== 'unknown') form.set('remoteip', ip);
      const res = await fetchImpl(VERIFY_URL, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`turnstile ${res.status}`);
      const data = await res.json();
      return data.success === true;
    },
  };
}

module.exports = { createTurnstile };
