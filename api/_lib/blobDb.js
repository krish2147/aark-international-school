const { put, list } = require('@vercel/blob');

const DB_KEY = 'content/db.json';

const DEFAULT_DB = {
  staff: [],
  gallery: [],
  events: [],
  schemes: [],
  fees: [],
};

async function readDb() {
  try {
    const { blobs } = await list({ prefix: DB_KEY, limit: 1 });
    if (!blobs.length) return { ...DEFAULT_DB };
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return { ...DEFAULT_DB };
    const data = await res.json();
    return { ...DEFAULT_DB, ...data };
  } catch (err) {
    console.error('readDb failed:', err);
    return { ...DEFAULT_DB };
  }
}

async function writeDb(db) {
  await put(DB_KEY, JSON.stringify(db, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

module.exports = { readDb, writeDb, DEFAULT_DB };
