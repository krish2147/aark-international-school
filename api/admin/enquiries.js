// Admin access to stored enquiries.
//   GET  ?month=YYYY-MM              → list (newest first)
//   GET  ?month=YYYY-MM&format=csv   → CSV download
//   POST {action:'retry', id, month} → resend the school notification email
//   POST {action:'status', id, month, status} → new | contacted | closed
const { requireAdmin } = require('../_lib/auth');
const { parseBody, isSameOrigin, methodNotAllowed, noStore } = require('../_lib/http');
const { createEnquiryStore } = require('../_lib/enquiryStore');
const { createEnquiryService } = require('../_lib/enquiryService');
const { createMailer } = require('../_lib/mailer');
const { createRateLimiter } = require('../_lib/rateLimit');
const { createTurnstile } = require('../_lib/turnstile');

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const ID_RE = /^[0-9a-f-]{36}$/i;
const STATUSES = ['new', 'contacted', 'closed'];
const CSV_COLUMNS = ['receivedAt', 'type', 'name', 'phone', 'email', 'child', 'grade', 'message', 'status', 'notification', 'duplicate', 'id'];

// Spreadsheet apps execute cells starting with = + - @ (CSV/formula injection).
function csvCell(value) {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function toCsv(records) {
  const rows = records.map(r => CSV_COLUMNS.map(c => csvCell(c === 'notification' ? (r.notification && r.notification.status) : r[c])).join(','));
  return [CSV_COLUMNS.join(','), ...rows].join('\r\n') + '\r\n';
}

function currentMonth(now) {
  return now().toISOString().slice(0, 7);
}

function createAdminEnquiriesHandler({ store, service, auth = requireAdmin, logger = console, now = () => new Date() }) {
  return async (req, res) => {
    noStore(res);
    if (!auth(req)) return res.status(401).json({ ok: false, error: 'Not authenticated.' });
    if (!store.configured) return res.status(503).json({ ok: false, error: 'Enquiry storage is not set up yet (BLOB_ENQUIRY_READ_WRITE_TOKEN).' });

    try {
      if (req.method === 'GET') {
        const month = String((req.query && req.query.month) || currentMonth(now));
        if (!MONTH_RE.test(month)) return res.status(400).json({ ok: false, error: 'month must be YYYY-MM.' });
        const records = await store.list(month);
        if (req.query.format === 'csv') {
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="aark-enquiries-${month}.csv"`);
          return res.status(200).send('﻿' + toCsv(records));
        }
        return res.status(200).json({ ok: true, month, items: records });
      }

      if (req.method !== 'POST') return methodNotAllowed(res, 'GET, POST');
      if (!isSameOrigin(req)) return res.status(403).json({ ok: false, error: 'Request blocked.' });
      const body = parseBody(req);
      const id = String(body.id || '');
      const month = String(body.month || '');
      if (!ID_RE.test(id) || !MONTH_RE.test(month)) return res.status(400).json({ ok: false, error: 'id and month are required.' });

      if (body.action === 'retry') {
        const result = await service.retryNotification(id, month);
        return res.status(result.status).json(result.body);
      }
      if (body.action === 'status') {
        if (!STATUSES.includes(body.status)) return res.status(400).json({ ok: false, error: 'Unknown status.' });
        const found = await store.get(id, month);
        if (!found) return res.status(404).json({ ok: false, error: 'Enquiry not found.' });
        found.record.status = body.status;
        found.record.statusUpdatedAt = now().toISOString();
        await store.update(found.record, found.etag);
        return res.status(200).json({ ok: true, item: found.record });
      }
      return res.status(400).json({ ok: false, error: 'Unknown action.' });
    } catch (err) {
      if (err && err.name === 'BlobPreconditionFailedError') return res.status(409).json({ ok: false, error: 'This enquiry was just changed. Reload and try again.' });
      logger.error('admin enquiries failed:', err.name, err.message);
      return res.status(503).json({ ok: false, error: 'Enquiry storage is unavailable right now.' });
    }
  };
}

const store = createEnquiryStore();
module.exports = createAdminEnquiriesHandler({
  store,
  service: createEnquiryService({ store, mailer: createMailer(), limiter: createRateLimiter(), turnstile: createTurnstile() }),
});
module.exports.createAdminEnquiriesHandler = createAdminEnquiriesHandler;
module.exports.toCsv = toCsv;
