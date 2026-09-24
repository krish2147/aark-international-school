const crypto = require('crypto');
const { readDb, writeDb } = require('./blobDb');
const { requireAdmin } = require('./auth');

// A small CRUD handler shared by every /api/content/<resource> endpoint.
// GET is public (read-only); POST/PUT/DELETE require an admin session.
function createResourceHandler(key) {
  return async (req, res) => {
    try {
      if (req.method === 'GET') {
        const db = await readDb();
        return res.status(200).json({ ok: true, items: db[key] || [] });
      }

      const session = requireAdmin(req);
      if (!session) {
        return res.status(401).json({ ok: false, error: 'Not authenticated.' });
      }

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const db = await readDb();
      db[key] = db[key] || [];

      if (req.method === 'POST') {
        const { id: _ignored, ...rest } = body;
        const item = { ...rest, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        db[key].push(item);
        await writeDb(db);
        return res.status(200).json({ ok: true, item });
      }

      if (req.method === 'PUT') {
        const { id } = body;
        if (!id) return res.status(400).json({ ok: false, error: 'id is required.' });
        const idx = db[key].findIndex(i => i.id === id);
        if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found.' });
        db[key][idx] = { ...db[key][idx], ...body, id, updatedAt: new Date().toISOString() };
        await writeDb(db);
        return res.status(200).json({ ok: true, item: db[key][idx] });
      }

      if (req.method === 'DELETE') {
        const id = (req.query && req.query.id) || body.id;
        if (!id) return res.status(400).json({ ok: false, error: 'id is required.' });
        const before = db[key].length;
        db[key] = db[key].filter(i => i.id !== id);
        if (db[key].length === before) return res.status(404).json({ ok: false, error: 'Not found.' });
        await writeDb(db);
        return res.status(200).json({ ok: true });
      }

      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ ok: false, error: 'Method not allowed.' });
    } catch (err) {
      console.error(`content/${key} handler failed:`, err);
      return res.status(500).json({ ok: false, error: 'Storage is not configured yet. Ask an admin to connect Blob storage in Vercel.' });
    }
  };
}

module.exports = { createResourceHandler };
