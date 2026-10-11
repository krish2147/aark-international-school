const crypto = require('crypto');
const { createSessionCookie } = require('../_lib/auth');
const { parseBody, clientIp, isSameOrigin, methodNotAllowed, noStore } = require('../_lib/http');
const { createRateLimiter } = require('../_lib/rateLimit');
const { envValue } = require('../_lib/storageEnv');

// Brute-force protection (D12): sign-in attempts per IP per 15 minutes, plus a
// global ceiling so a distributed attack on the single shared account is slowed too.
// Every attempt counts (successful ones included); sessions last 12 hours.
const LIMITS = { perIp: [8, 900], global: [60, 900] };

function timingSafeStringEqual(a, b) {
  // Hash first so the comparison is constant-time regardless of input length.
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function createLoginHandler({ limiter, env = process.env, logger = console }) {
  return async (req, res) => {
    noStore(res);
    if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
    if (!isSameOrigin(req)) return res.status(403).json({ ok: false, error: 'Request blocked.' });

    // Preview deployments use PREVIEW_ADMIN_* only (see _lib/storageEnv.js).
    const [ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET] = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET'].map(n => envValue(n, env));
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
      logger.error('Missing ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_SESSION_SECRET env vars');
      return res.status(500).json({ ok: false, error: 'Admin login is not configured yet.' });
    }

    const ip = clientIp(req);
    const ipState = await limiter.hit(`login:attempt:${ip}`, LIMITS.perIp[0], LIMITS.perIp[1]);
    const globalState = await limiter.hit('login:attempt:all', LIMITS.global[0], LIMITS.global[1]);
    if (!ipState.allowed || !globalState.allowed) {
      return res.status(429).json({ ok: false, error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' });
    }

    const body = parseBody(req);
    const username = (body.username || '').toString().trim();
    const password = (body.password || '').toString();
    const userOk = timingSafeStringEqual(username, ADMIN_USERNAME);
    const passOk = timingSafeStringEqual(password, ADMIN_PASSWORD);

    if (!username || !password || !(userOk && passOk)) {
      logger.warn('admin login failed', { ip });
      return res.status(401).json({ ok: false, error: 'Invalid username or password.' });
    }

    logger.info('admin login ok', { ip });
    res.setHeader('Set-Cookie', createSessionCookie(username));
    return res.status(200).json({ ok: true });
  };
}

module.exports = createLoginHandler({ limiter: createRateLimiter() });
module.exports.createLoginHandler = createLoginHandler;
module.exports.LIMITS = LIMITS;
