const crypto = require('crypto');
const { requireAdmin } = require('./auth');
const { parseBody, isSameOrigin, methodNotAllowed, noStore } = require('./http');
const { sanitize, RESOURCES } = require('./contentSchema');
const { ConflictError } = require('./contentStore');

// CRUD for /api/content/<resource>. GET is public and CDN-cached; ?fresh=1 from a
// signed-in admin skips the cache so the admin panel always sees its own saves.
// POST/PUT/DELETE require an admin session from this site's own pages.
function createContentHandler({ store, auth = requireAdmin, logger = console, uuid = crypto.randomUUID, now = () => new Date() }) {
  return async (req, res) => {
    const key = (req.query && req.query.resource) || '';
    if (!RESOURCES[key]) return res.status(404).json({ ok: false, error: 'Not found.' });

    try {
      if (req.method === 'GET') {
        const admin = req.query.fresh && auth(req);
        const { db, version } = await store.read();
        if (admin) noStore(res);
        else res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
        return res.status(200).json({ ok: true, items: db[key] || [], version });
      }

      if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return methodNotAllowed(res, 'GET, POST, PUT, DELETE');
      noStore(res);
      if (!auth(req)) return res.status(401).json({ ok: false, error: 'Not authenticated.' });
      if (!isSameOrigin(req)) return res.status(403).json({ ok: false, error: 'Request blocked.' });

      const body = parseBody(req);
      const { db, version } = await store.read();
      const items = db[key] = db[key] || [];

      if (req.method === 'POST') {
        const { item, error } = sanitize(key, body);
        if (error) return res.status(400).json({ ok: false, error });
        const created = { ...item, id: uuid(), createdAt: now().toISOString() };
        items.push(created);
        const saved = await store.write(db, version);
        return res.status(200).json({ ok: true, item: created, version: saved });
      }

      const id = String((req.method === 'DELETE' && req.query.id) || body.id || '');
      if (!id) return res.status(400).json({ ok: false, error: 'id is required.' });
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found.' });

      if (req.method === 'PUT') {
        const { item, error } = sanitize(key, body, { partial: true });
        if (error) return res.status(400).json({ ok: false, error });
        items[idx] = { ...items[idx], ...item, id, updatedAt: now().toISOString() };
        const saved = await store.write(db, version);
        return res.status(200).json({ ok: true, item: items[idx], version: saved });
      }

      items.splice(idx, 1);
      const saved = await store.write(db, version);
      return res.status(200).json({ ok: true, version: saved });
    } catch (err) {
      if (err instanceof ConflictError) return res.status(409).json({ ok: false, error: err.message });
      logger.error(`content/${key} ${req.method} failed:`, err.name, err.message);
      return res.status(503).json({ ok: false, error: 'Content storage is unavailable right now. Nothing was changed — please try again shortly.' });
    }
  };
}

module.exports = { createContentHandler };
