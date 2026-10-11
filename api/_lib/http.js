// Small request/response helpers shared by every function.

function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
}

function clientIp(req) {
  const fwd = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
  return fwd || (req.headers['x-real-ip'] || '').toString() || (req.socket && req.socket.remoteAddress) || 'unknown';
}

// Defence in depth on top of the SameSite=Strict session cookie: a state-changing
// admin request must come from this site's own pages. Requests without an Origin
// header (same-origin GETs, curl) are judged by Referer when present.
function isSameOrigin(req) {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const source = (req.headers.origin || req.headers.referer || '').toString();
  if (!source) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

function methodNotAllowed(res, allow) {
  res.setHeader('Allow', allow);
  return res.status(405).json({ ok: false, error: 'Method not allowed.' });
}

function noStore(res) {
  res.setHeader('Cache-Control', 'private, no-store');
}

module.exports = { parseBody, clientIp, isSameOrigin, methodNotAllowed, noStore };
