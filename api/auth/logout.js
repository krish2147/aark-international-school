const { clearSessionCookie } = require('../_lib/auth');
const { rejectCrossSiteRequest } = require('../_lib/requestSecurity');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (rejectCrossSiteRequest(req, res)) return;
  clearSessionCookie(res, req);
  return res.status(200).json({ ok: true });
};
