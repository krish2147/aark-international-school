// GET  /api/admin/content-history          → saved versions of the admin content (newest first)
// POST /api/admin/content-history {version} → restore that version as a new save (nothing is deleted)
const { requireAdmin } = require('../_lib/auth');
const { parseBody, isSameOrigin, methodNotAllowed, noStore } = require('../_lib/http');
const { createContentStore, ConflictError } = require('../_lib/contentStore');

function createHistoryHandler({ store, auth = requireAdmin, logger = console }) {
  return async (req, res) => {
    noStore(res);
    if (!auth(req)) return res.status(401).json({ ok: false, error: 'Not authenticated.' });
    try {
      if (req.method === 'GET') {
        const versions = await store.listVersions();
        return res.status(200).json({
          ok: true,
          versions: versions.reverse().map(v => ({ version: v.seq, savedAt: v.uploadedAt, size: v.size })),
        });
      }
      if (req.method !== 'POST') return methodNotAllowed(res, 'GET, POST');
      if (!isSameOrigin(req)) return res.status(403).json({ ok: false, error: 'Request blocked.' });
      const version = Number(parseBody(req).version);
      if (!Number.isInteger(version) || version < 0) return res.status(400).json({ ok: false, error: 'A version number is required.' });
      const saved = await store.restore(version);
      if (saved === null) return res.status(404).json({ ok: false, error: 'That version does not exist.' });
      return res.status(200).json({ ok: true, version: saved, restoredFrom: version });
    } catch (err) {
      if (err instanceof ConflictError) return res.status(409).json({ ok: false, error: err.message });
      logger.error('content-history failed:', err.name, err.message);
      return res.status(503).json({ ok: false, error: 'Content storage is unavailable right now. Nothing was changed.' });
    }
  };
}

module.exports = createHistoryHandler({ store: createContentStore() });
module.exports.createHistoryHandler = createHistoryHandler;
