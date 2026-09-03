const { verifyPassword, createSessionToken, setSessionCookie } = require('../_lib/auth');

const attempts = global._aarkLoginAttempts || (global._aarkLoginAttempts = new Map());
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const record = attempts.get(ip);
    if (record && record.resetAt > now && record.count >= MAX_ATTEMPTS) {
      res.setHeader('Retry-After', String(Math.ceil((record.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const expectedEmail = process.env.ADMIN_EMAIL;
    if (!expectedEmail) {
      console.error('/api/auth/login: ADMIN_EMAIL is not set.');
      return res.status(500).json({ error: 'Admin login is not configured on the server yet.' });
    }
    if (email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()) {
      attempts.set(ip, { count: record && record.resetAt > now ? record.count + 1 : 1, resetAt: record && record.resetAt > now ? record.resetAt : now + WINDOW_MS });
      // Same generic message as a wrong password — don't reveal which part was wrong.
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordOk = await verifyPassword(password);
    if (!passwordOk) {
      const current = attempts.get(ip);
      attempts.set(ip, { count: current && current.resetAt > now ? current.count + 1 : 1, resetAt: current && current.resetAt > now ? current.resetAt : now + WINDOW_MS });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createSessionToken(expectedEmail);
    attempts.delete(ip);
    setSessionCookie(res, token, req);
    return res.status(200).json({ ok: true, email: expectedEmail });
  } catch (err) {
    console.error('/api/auth/login error:', err.message);
    return res.status(500).json({ error: 'Admin login is not configured correctly on the server. Check ADMIN_EMAIL, ADMIN_PASSWORD_HASH, and SESSION_SECRET.' });
  }
};
