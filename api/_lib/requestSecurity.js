// Reject browser requests that explicitly originate from another site.
// This complements SameSite cookies; production authenticated mutations
// should additionally use dedicated CSRF tokens.
function isCrossSiteRequest(req) {
  const headers = (req && req.headers) || {};
  if (headers['sec-fetch-site'] === 'cross-site') return true;
  const origin = headers.origin;
  const host = headers['x-forwarded-host'] || headers.host;
  if (!origin || !host) return false;
  try { return new URL(origin).host !== String(host).split(',')[0].trim(); }
  catch { return true; }
}

function rejectCrossSiteRequest(req, res) {
  if (!isCrossSiteRequest(req)) return false;
  res.status(403).json({ error: 'Cross-site request rejected.' });
  return true;
}

module.exports = { rejectCrossSiteRequest };
