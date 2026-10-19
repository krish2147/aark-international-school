// Test doubles: an in-memory Vercel Blob with the same contract our code relies on
// (allowOverwrite:false refusal, ifMatch ETag checks, list paging, private get),
// plus request/response fakes for the serverless handlers.

let etagCounter = 0;

function createFakeBlob() {
  const files = new Map(); // pathname -> { body, etag, uploadedAt, access }
  const calls = [];
  const fail = { list: null, put: null, get: null, fetch: null };
  const urlFor = p => `https://store.public.blob.vercel-storage.com/${p}`;

  const blob = {
    files, calls, fail,
    async put(pathname, body, opts = {}) {
      calls.push(['put', pathname, opts]);
      if (fail.put) throw fail.put;
      const existing = files.get(pathname);
      if (existing && !opts.allowOverwrite) {
        throw new Error('Vercel Blob: This blob already exists, use `allowOverwrite: true` if you want to overwrite it.');
      }
      if (opts.ifMatch && (!existing || existing.etag !== opts.ifMatch)) {
        const err = new Error('Precondition failed: ETag mismatch.');
        err.name = 'BlobPreconditionFailedError';
        throw err;
      }
      const etag = `"e${++etagCounter}"`;
      files.set(pathname, { body: String(body), etag, uploadedAt: new Date(Date.UTC(2026, 9, 10, 0, 0, etagCounter)), access: opts.access });
      return { url: urlFor(pathname), pathname, etag };
    },
    async list({ prefix = '', cursor, limit = 1000 } = {}) {
      calls.push(['list', prefix]);
      if (fail.list) throw fail.list;
      const all = [...files.keys()].filter(p => p.startsWith(prefix)).sort();
      const start = cursor ? Number(cursor) : 0;
      const page = all.slice(start, start + limit);
      const hasMore = start + limit < all.length;
      return {
        blobs: page.map(p => ({ pathname: p, url: urlFor(p), uploadedAt: files.get(p).uploadedAt, size: files.get(p).body.length })),
        hasMore,
        cursor: hasMore ? String(start + limit) : undefined,
      };
    },
    async get(pathname) {
      calls.push(['get', pathname]);
      if (fail.get) throw fail.get;
      const f = files.get(pathname);
      if (!f) return null;
      return { statusCode: 200, stream: new Response(f.body).body, blob: { etag: f.etag, pathname } };
    },
  };

  // fetch() for public blob URLs, as used by the content store.
  const fetchImpl = async url => {
    calls.push(['fetch', url]);
    if (fail.fetch) throw fail.fetch;
    const p = url.replace(/^https:\/\/store\.public\.blob\.vercel-storage\.com\//, '');
    const f = files.get(p);
    return f ? new Response(f.body, { status: 200 }) : new Response('not found', { status: 404 });
  };

  return { blob, fetchImpl };
}

function createReq({ method = 'GET', body, query = {}, headers = {}, cookieAdmin = false } = {}) {
  const h = { host: 'aark.test', ...headers };
  if (cookieAdmin) h.__admin = '1';
  return { method, body, query, headers: h, socket: { remoteAddress: '203.0.113.9' } };
}

function createRes() {
  const res = {
    statusCode: 200, headers: {}, body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
    send(data) { this.body = data; return this; },
    written: '', ended: false,
    write(chunk) { this.written += chunk; return true; },
    end() { this.ended = true; return this; },
  };
  return res;
}

const sameOrigin = { origin: 'https://aark.test' };
const fakeAuth = req => (req.headers.__admin ? { u: 'admin' } : null);
const silentLogger = { error() {}, warn() {}, info() {} };

function memoryLimiter() {
  const counts = new Map();
  return {
    counts,
    async hit(key, limit) {
      const n = (counts.get(key) || 0) + 1;
      counts.set(key, n);
      return { allowed: n <= limit, count: n };
    },
  };
}

module.exports = { createFakeBlob, createReq, createRes, sameOrigin, fakeAuth, silentLogger, memoryLimiter };
