// Admin content store on Vercel Blob (public store: the content is public anyway).
//
// Every save writes a NEW immutable file, content/versions/<seq>.json, and never
// overwrites an existing one:
// - Fail-closed: any error listing or fetching the store throws. A storage outage
//   is never mistaken for an empty database, so it can never be saved over.
// - Concurrency: a save based on version N creates version N+1 with
//   allowOverwrite:false. If another save already created N+1, the Blob API
//   refuses and the caller gets a ConflictError instead of silently losing
//   the other edit.
// - No stale reads: versions are immutable, so a CDN-cached copy is never out
//   of date; "which version is latest" comes from list(), an API call.
// - Backups: every previous version stays readable and restorable.
// The pre-versioning file content/db.json is read (never written or deleted)
// as version 0 until the first save after this change.

const { blobToken } = require('./storageEnv');

const SEQ_WIDTH = 6;

const DEFAULT_DB = { staff: [], gallery: [], events: [], schemes: [], fees: [] };

class StorageError extends Error {
  constructor(message, cause) { super(message); this.name = 'StorageError'; this.cause = cause; }
}
class ConflictError extends Error {
  constructor() { super('The content was changed by another save. Reload and try again.'); this.name = 'ConflictError'; }
}

// Each store keeps its versions under <prefix>/versions/. The admin content uses
// 'content'; the page-by-page website edits use 'site' (see siteEdits.js).
const versionPrefix = prefix => `${prefix}/versions/`;
const seqFromPathname = (p, prefix = 'content') => {
  const m = new RegExp(`^${prefix}/versions/(\\d+)\\.json$`).exec(p);
  return m ? Number(m[1]) : null;
};
const pathnameForSeq = (seq, prefix = 'content') => `${versionPrefix(prefix)}${String(seq).padStart(SEQ_WIDTH, '0')}.json`;

function isAlreadyExists(err) {
  return Boolean(err) && (err.name === 'BlobPreconditionFailedError' || /already exists/i.test(err.message || ''));
}

function createContentStore({ blob = require('@vercel/blob'), fetchImpl = globalThis.fetch, token = blobToken('content'), prefix = 'content', defaults = DEFAULT_DB } = {}) {
  const VERSION_PREFIX = versionPrefix(prefix);
  // Only the admin content predates versioning; other stores have no legacy file.
  const LEGACY_KEY = prefix === 'content' ? 'content/db.json' : null;
  const DEFAULTS = defaults;
  function requireToken() {
    if (!token) throw new StorageError('content storage is not configured for this environment');
    return token;
  }

  async function listAll(prefix) {
    const out = [];
    let cursor;
    do {
      const page = await blob.list({ prefix, cursor, limit: 1000, token: requireToken() });
      out.push(...page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return out;
  }

  async function fetchJson(url) {
    const res = await fetchImpl(url, { cache: 'no-store' });
    if (!res.ok) throw new StorageError(`content fetch failed (${res.status})`);
    return res.json();
  }

  async function listVersions() {
    try {
      const blobs = await listAll(VERSION_PREFIX);
      return blobs
        .map(b => ({ seq: seqFromPathname(b.pathname, prefix), url: b.url, uploadedAt: b.uploadedAt, size: b.size }))
        .filter(v => v.seq !== null)
        .sort((a, b) => a.seq - b.seq);
    } catch (err) {
      throw err instanceof StorageError ? err : new StorageError('content list failed', err);
    }
  }

  // Returns { db, version } where version is the seq the next save must build on.
  async function read() {
    try {
      const versions = await listVersions();
      if (versions.length) {
        const latest = versions[versions.length - 1];
        return { db: { ...DEFAULTS, ...(await fetchJson(latest.url)) }, version: latest.seq };
      }
      const legacy = await readLegacy();
      if (legacy) return { db: legacy, version: 0 };
      return { db: structuredClone(DEFAULTS), version: 0 };
    } catch (err) {
      throw err instanceof StorageError ? err : new StorageError('content read failed', err);
    }
  }

  async function write(db, baseVersion) {
    if (!Number.isInteger(baseVersion) || baseVersion < 0) throw new StorageError('a base version is required to save');
    const seq = baseVersion + 1;
    try {
      await blob.put(pathnameForSeq(seq, prefix), JSON.stringify(db, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: false,
        token: requireToken(),
      });
      return seq;
    } catch (err) {
      if (isAlreadyExists(err)) throw new ConflictError();
      throw new StorageError('content write failed', err);
    }
  }

  async function readVersion(seq) {
    const v = (await listVersions()).find(x => x.seq === seq);
    if (!v) return null;
    return { ...DEFAULTS, ...(await fetchJson(v.url)) };
  }

  // Restoring copies an old version forward as the newest one; nothing is deleted.
  async function restore(seq) {
    const target = seq === 0 ? await readLegacy() : await readVersion(seq);
    if (!target) return null;
    const { version } = await read();
    return write(target, version);
  }

  async function readLegacy() {
    if (!LEGACY_KEY) return null;
    const legacy = (await listAll(LEGACY_KEY)).find(b => b.pathname === LEGACY_KEY);
    return legacy ? { ...DEFAULTS, ...(await fetchJson(legacy.url)) } : null;
  }

  return { read, write, listVersions, readVersion, restore };
}

module.exports = { createContentStore, DEFAULT_DB, StorageError, ConflictError, pathnameForSeq };
