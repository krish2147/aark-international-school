const crypto = require('crypto');
const { put } = require('@vercel/blob');
const { requireAdmin } = require('../_lib/auth');

const MAX_BYTES = 3 * 1024 * 1024; // 3MB raw (~4MB base64, under Vercel's 4.5MB function body limit)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
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

  const filename = (body.filename || 'photo').toString();
  const dataUrl = (body.dataUrl || '').toString();

  const match = /^data:([\w/+.-]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) {
    return res.status(400).json({ ok: false, error: 'A valid image data URL is required.' });
  }
  const [, contentType, base64] = match;
  if (!contentType.startsWith('image/')) {
    return res.status(400).json({ ok: false, error: 'Only image uploads are allowed.' });
  }

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_BYTES) {
    return res.status(400).json({ ok: false, error: 'Image is too large — please keep uploads under 3MB.' });
  }

  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-80) || 'photo';
  const pathname = `uploads/${crypto.randomUUID()}-${safeName}`;

  try {
    const blob = await put(pathname, buffer, { access: 'public', contentType });
    return res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    console.error('Admin upload failed:', err);
    return res.status(500).json({ ok: false, error: 'Upload failed.' });
  }
};
