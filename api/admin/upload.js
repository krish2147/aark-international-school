const crypto = require('crypto');
const { put } = require('@vercel/blob');
const { requireAdmin } = require('../_lib/auth');
const { parseBody, isSameOrigin, methodNotAllowed, noStore } = require('../_lib/http');

const MAX_BYTES = 3 * 1024 * 1024; // 3MB raw (~4MB base64, under Vercel's 4.5MB function body limit)

// Raster formats only (D14): SVG can carry script, so it is refused. The declared
// type must match the file's actual signature bytes.
const SIGNATURES = {
  'image/jpeg': { ext: 'jpg', test: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', test: b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { ext: 'webp', test: b => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  'image/avif': { ext: 'avif', test: b => b.subarray(4, 8).toString('latin1') === 'ftyp' && /avi[fs]/.test(b.subarray(8, 12).toString('latin1')) },
};

function createUploadHandler({ putImpl = put, auth = requireAdmin, logger = console, uuid = crypto.randomUUID }) {
  return async (req, res) => {
    noStore(res);
    if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
    if (!auth(req)) return res.status(401).json({ ok: false, error: 'Not authenticated.' });
    if (!isSameOrigin(req)) return res.status(403).json({ ok: false, error: 'Request blocked.' });

    const body = parseBody(req);
    const dataUrl = (body.dataUrl || '').toString();
    const match = /^data:([\w/+.-]+);base64,(.*)$/s.exec(dataUrl);
    if (!match) return res.status(400).json({ ok: false, error: 'A valid image data URL is required.' });

    const [, contentType, base64] = match;
    const kind = SIGNATURES[contentType];
    if (!kind) return res.status(400).json({ ok: false, error: 'Please upload a JPG, PNG, WebP or AVIF photo.' });

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > MAX_BYTES) return res.status(400).json({ ok: false, error: 'Image is too large — please keep uploads under 3MB.' });
    if (!kind.test(buffer)) return res.status(400).json({ ok: false, error: 'That file is not a valid image.' });

    const base = (body.filename || 'photo').toString().split(/[\\/]/).pop().replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9\-_]/g, '_').slice(-60) || 'photo';
    try {
      const blob = await putImpl(`uploads/${uuid()}-${base}.${kind.ext}`, buffer, { access: 'public', contentType });
      return res.status(200).json({ ok: true, url: blob.url });
    } catch (err) {
      logger.error('Admin upload failed:', err.name, err.message);
      return res.status(500).json({ ok: false, error: 'Upload failed.' });
    }
  };
}

module.exports = createUploadHandler({});
module.exports.createUploadHandler = createUploadHandler;
