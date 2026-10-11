// Per-environment settings: which Blob token, email account and admin login each deployment uses.
//
// On Preview deployments (VERCEL_ENV=preview) ONLY the PREVIEW_-prefixed tokens are
// read, never the production names. So a Preview cannot write production content or
// enquiries even if a production token is also attached to Preview by mistake: with
// no PREVIEW_ token, storage is simply "not configured" there.
const NAMES = {
  content: 'BLOB_READ_WRITE_TOKEN',
  enquiry: 'BLOB_ENQUIRY_READ_WRITE_TOKEN',
};

// Same rule for any other per-environment setting (email, admin login).
function envValue(name, env = process.env) {
  return env.VERCEL_ENV === 'preview' ? env[`PREVIEW_${name}`] : env[name];
}

function blobToken(kind, env = process.env) {
  const name = NAMES[kind];
  if (!name) throw new Error(`unknown store: ${kind}`);
  return envValue(name, env);
}

module.exports = { blobToken, envValue, NAMES };
