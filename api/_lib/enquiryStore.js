// Enquiry records on a PRIVATE Vercel Blob store (parents' contact details are
// never publicly addressable). Uses its own token, ENQUIRY_BLOB_READ_WRITE_TOKEN,
// so it is a separate store from the public content/photo store.
//
// Layout:
//   enquiries/<yyyy>/<mm>/<id>.json          one record per enquiry
//   enquiries/_dedupe/<yyyy-mm-dd>/<hash>    marker: same parent+phone+type+grade today
// Records are created with allowOverwrite:false (an id can never be reused or
// clobbered) and later updated only with ifMatch on the ETag we last saw.

const crypto = require('crypto');

class DuplicateError extends Error {
  constructor() { super('duplicate'); this.name = 'DuplicateError'; }
}

const isAlreadyExists = err => Boolean(err) && /already exists/i.test(err.message || '');
const monthOf = iso => iso.slice(0, 7).replace('-', '/');
const pathFor = (id, receivedAt) => `enquiries/${monthOf(receivedAt)}/${id}.json`;

const streamToString = stream => new Response(stream).text();

function createEnquiryStore({ blob = require('@vercel/blob'), env = process.env } = {}) {
  const token = env.ENQUIRY_BLOB_READ_WRITE_TOKEN;
  const opts = extra => ({ access: 'private', token, addRandomSuffix: false, contentType: 'application/json', ...extra });

  return {
    configured: Boolean(token),

    // Throws DuplicateError when this id was already stored (a retried submit).
    async create(record) {
      try {
        const res = await blob.put(pathFor(record.id, record.receivedAt), JSON.stringify(record), opts({ allowOverwrite: false }));
        return { etag: res.etag };
      } catch (err) {
        if (isAlreadyExists(err)) throw new DuplicateError();
        throw err;
      }
    },

    async update(record, etag) {
      const res = await blob.put(pathFor(record.id, record.receivedAt), JSON.stringify(record), opts({ allowOverwrite: true, ifMatch: etag }));
      return { etag: res.etag };
    },

    // True the first time a fingerprint is claimed for the day, false afterwards.
    async claimFingerprint(day, parts) {
      const hash = crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
      try {
        await blob.put(`enquiries/_dedupe/${day}/${hash}`, '1', opts({ allowOverwrite: false, contentType: 'text/plain' }));
        return true;
      } catch (err) {
        if (isAlreadyExists(err)) return false;
        throw err;
      }
    },

    async get(id, month) {
      const res = await blob.get(`enquiries/${month.replace('-', '/')}/${id}.json`, { access: 'private', token, useCache: false });
      if (!res) return null;
      return { record: JSON.parse(await streamToString(res.stream)), etag: res.blob.etag };
    },

    // month = 'YYYY-MM'. Newest first.
    async list(month) {
      const prefix = `enquiries/${month.replace('-', '/')}/`;
      const items = [];
      let cursor;
      do {
        const page = await blob.list({ prefix, cursor, limit: 1000, token });
        items.push(...page.blobs);
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      const records = [];
      for (const b of items) {
        const res = await blob.get(b.pathname, { access: 'private', token, useCache: false });
        if (res) records.push(JSON.parse(await streamToString(res.stream)));
      }
      return records.sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
    },
  };
}

module.exports = { createEnquiryStore, DuplicateError, pathFor };
