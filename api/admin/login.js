const crypto = require('crypto');
const { createSessionCookie } = require('../_lib/auth');

function timingSafeStringEqual(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    console.error('Missing ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_SESSION_SECRET env vars');
    return res.status(500).json({ ok: false, error: 'Admin login is not configured yet.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const username = (body.username || '').toString().trim();
  const password = (body.password || '').toString();

  const ok = username && password
    && timingSafeStringEqual(username, ADMIN_USERNAME)
    && timingSafeStringEqual(password, ADMIN_PASSWORD);

  if (!ok) {
    return res.status(401).json({ ok: false, error: 'Invalid username or password.' });
  }

  res.setHeader('Set-Cookie', createSessionCookie(username));
  return res.status(200).json({ ok: true });
};
