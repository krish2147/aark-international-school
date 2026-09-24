const crypto = require('crypto');

const COOKIE_NAME = 'aark_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function sign(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify(token) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

// Vercel sets the VERCEL env var in every deployed environment (production
// and preview), which is always HTTPS. Only a local `node` dev server lacks
// it, so that's the one case the Secure flag is dropped (browsers refuse
// Secure cookies over plain http://localhost).
const SECURE_FLAG = process.env.VERCEL ? '; Secure' : '';

function createSessionCookie(username) {
  const token = sign({ u: username, exp: Date.now() + SESSION_TTL_MS });
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; SameSite=Strict${SECURE_FLAG}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${SECURE_FLAG}`;
}

function requireAdmin(req) {
  const cookies = parseCookies(req);
  return verify(cookies[COOKIE_NAME]);
}

module.exports = { createSessionCookie, clearSessionCookie, requireAdmin, COOKIE_NAME };
