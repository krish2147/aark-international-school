const { requireAdmin } = require('../_lib/auth');

module.exports = async (req, res) => {
  const session = requireAdmin(req);
  return res.status(200).json({ ok: true, authenticated: !!session, username: session ? session.u : null });
};
