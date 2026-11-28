const { requireAdmin } = require('./auth');
const { parseBody, isSameOrigin, methodNotAllowed, noStore } = require('./http');
const { ConflictError } = require('./contentStore');
const { sanitizePageEdits } = require('./siteEdits');

// /api/site/edits
//   GET                     public: every published page edit (CDN-cached briefly)
//   GET ?fresh=1            signed-in admin: the same, uncached
//   GET ?history=1          signed-in admin: saved versions, newest first
//   PUT {baseVersion, pages} signed-in admin: replace the edits of the given pages
//   POST {restore}          signed-in admin: copy an old version forward
// One function serves all of it to stay inside the plan's function limit.
function createSiteEditsHandler({ store, auth = requireAdmin, logger = console, now = () => new Date() }) {
  return async (req, res) => {
    const q = req.query || {};
    try {
      if (req.method === 'GET' && !q.history) {
        const admin = q.fresh && auth(req);
        const { db, version } = await store.read();
        if (admin) noStore(res);
        else res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=120');
        return res.status(200).json({ ok: true, pages: db.pages || {}, version, updatedAt: db.updatedAt || null });
      }

      noStore(res);
      if (!auth(req)) return res.status(401).json({ ok: false, error: 'Not authenticated.' });

      if (req.method === 'GET') {
        const versions = await store.listVersions();
        return res.status(200).json({
          ok: true,
          versions: versions.reverse().map(v => ({ version: v.seq, savedAt: v.uploadedAt, size: v.size })),
        });
      }
      if (!['PUT', 'POST'].includes(req.method)) return methodNotAllowed(res, 'GET, PUT, POST');
      if (!isSameOrigin(req)) return res.status(403).json({ ok: false, error: 'Request blocked.' });
      const body = parseBody(req);

      if (req.method === 'POST') {
        const version = Number(body.restore);
        if (!Number.isInteger(version) || version < 1) return res.status(400).json({ ok: false, error: 'A version number is required.' });
        const saved = await store.restore(version);
        if (saved === null) return res.status(404).json({ ok: false, error: 'That version does not exist.' });
        return res.status(200).json({ ok: true, version: saved, restoredFrom: version });
      }

      const pages = body.pages;
      if (!pages || typeof pages !== 'object' || Array.isArray(pages) || !Object.keys(pages).length || Object.keys(pages).length > 3) {
        return res.status(400).json({ ok: false, error: 'Nothing to publish.' });
      }
      const clean = {};
      for (const [page, edits] of Object.entries(pages)) {
        const result = sanitizePageEdits(page, edits);
        if (result.error) return res.status(400).json({ ok: false, error: result.error });
        clean[page] = result.edits;
      }
      const { db, version } = await store.read();
      if (Number(body.baseVersion) !== version) throw new ConflictError();
      db.pages = db.pages || {};
      for (const [page, edits] of Object.entries(clean)) {
        if (Object.keys(edits).length) db.pages[page] = edits;
        else delete db.pages[page];
      }
      db.updatedAt = now().toISOString();
      const saved = await store.write(db, version);
      return res.status(200).json({ ok: true, version: saved, pages: db.pages });
    } catch (err) {
      if (err instanceof ConflictError) {
        return res.status(409).json({ ok: false, error: 'The website was changed in another window. Reload this page, then make your change again.' });
      }
      logger.error(`site/edits ${req.method} failed:`, err.name, err.message);
      return res.status(503).json({ ok: false, error: 'Website storage is unavailable right now. Nothing was changed — please try again shortly.' });
    }
  };
}

module.exports = { createSiteEditsHandler };
