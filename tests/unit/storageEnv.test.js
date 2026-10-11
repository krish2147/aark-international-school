const test = require('node:test');
const assert = require('node:assert/strict');
const { blobToken } = require('../../api/_lib/storageEnv');
const { createContentStore, StorageError } = require('../../api/_lib/contentStore');
const { createEnquiryStore } = require('../../api/_lib/enquiryStore');
const { createUploadHandler } = require('../../api/admin/upload');
const { createFakeBlob, createReq, createRes, sameOrigin, fakeAuth, silentLogger } = require('./helpers');

const PROD = { BLOB_READ_WRITE_TOKEN: 'prod-content', BLOB_ENQUIRY_READ_WRITE_TOKEN: 'prod-enquiry' };

test('production and local use the normal token names', () => {
  assert.equal(blobToken('content', { ...PROD, VERCEL_ENV: 'production' }), 'prod-content');
  assert.equal(blobToken('enquiry', { ...PROD }), 'prod-enquiry');
});

test('Preview never reads production tokens, even when they are attached to Preview', () => {
  const env = { ...PROD, VERCEL_ENV: 'preview' };
  assert.equal(blobToken('content', env), undefined);
  assert.equal(blobToken('enquiry', env), undefined);
  const withPreview = { ...env, PREVIEW_BLOB_READ_WRITE_TOKEN: 'pv-content', PREVIEW_BLOB_ENQUIRY_READ_WRITE_TOKEN: 'pv-enquiry' };
  assert.equal(blobToken('content', withPreview), 'pv-content');
  assert.equal(blobToken('enquiry', withPreview), 'pv-enquiry');
});

test('without a token for this environment, nothing is read or written', async () => {
  const fake = createFakeBlob();
  const store = createContentStore({ blob: fake.blob, fetchImpl: fake.fetchImpl, token: undefined });
  await assert.rejects(store.read(), StorageError);
  await assert.rejects(store.write({}, 0), StorageError);
  assert.equal(fake.blob.calls.length, 0);

  const enquiries = createEnquiryStore({ blob: fake.blob, env: { ...PROD, VERCEL_ENV: 'preview' } });
  assert.equal(enquiries.configured, false);

  const res = createRes();
  await createUploadHandler({ putImpl: async () => { throw new Error('must not be called'); }, auth: fakeAuth, logger: silentLogger, token: undefined })(
    createReq({ method: 'POST', cookieAdmin: true, headers: sameOrigin, body: { dataUrl: 'data:image/png;base64,' + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64') } }), res);
  assert.equal(res.statusCode, 503);
});

test('the token is passed to every Blob call', async () => {
  const fake = createFakeBlob();
  const store = createContentStore({ blob: fake.blob, fetchImpl: fake.fetchImpl, token: 'scoped' });
  await store.write({ fees: [] }, 0);
  await store.read();
  for (const [op, , opts] of fake.blob.calls.filter(c => c[0] === 'put')) assert.equal(opts.token, 'scoped', op);
});

test('Preview email uses only PREVIEW_ settings, never the school mailbox', async () => {
  const { createMailer } = require('../../api/_lib/mailer');
  const sent = [];
  const transportFactory = cfg => ({ sendMail: async m => sent.push({ auth: cfg.auth.user, ...m }) });
  const school = { GMAIL_USER: 'admissions@school.test', GMAIL_APP_PASSWORD: 'real', SCHOOL_RECEIVING_EMAIL: 'admissions@school.test' };

  assert.equal(createMailer({ env: { ...school, VERCEL_ENV: 'preview' }, transportFactory }).configured, false);

  const pv = createMailer({ env: { ...school, VERCEL_ENV: 'preview', PREVIEW_GMAIL_USER: 'test@example.com', PREVIEW_GMAIL_APP_PASSWORD: 'fake' }, transportFactory });
  await pv.sendToSchool({ subject: 's', text: 't' });
  assert.deepEqual([sent[0].auth, sent[0].to], ['test@example.com', 'test@example.com']);

  const prod = createMailer({ env: { ...school, VERCEL_ENV: 'production' }, transportFactory });
  await prod.sendToSchool({ subject: 's', text: 't' });
  assert.deepEqual([sent[1].auth, sent[1].to], ['admissions@school.test', 'admissions@school.test']);
});

test('Preview admin login accepts only PREVIEW_ADMIN_* credentials', async () => {
  const { createLoginHandler } = require('../../api/admin/login');
  const { memoryLimiter } = require('./helpers');
  const env = {
    VERCEL_ENV: 'preview',
    ADMIN_USERNAME: 'real-admin', ADMIN_PASSWORD: 'real-password', ADMIN_SESSION_SECRET: 'r'.repeat(64),
  };
  const notSetUp = createRes();
  await createLoginHandler({ limiter: memoryLimiter(), env, logger: silentLogger })(createReq({ method: 'POST', headers: sameOrigin, body: { username: 'real-admin', password: 'real-password' } }), notSetUp);
  assert.equal(notSetUp.statusCode, 500, 'production credentials are not used on Preview');

  const withPreview = { ...env, PREVIEW_ADMIN_USERNAME: 'tester', PREVIEW_ADMIN_PASSWORD: 'preview-only', PREVIEW_ADMIN_SESSION_SECRET: 'p'.repeat(64) };
  const realOnPreview = createRes();
  await createLoginHandler({ limiter: memoryLimiter(), env: withPreview, logger: silentLogger })(createReq({ method: 'POST', headers: sameOrigin, body: { username: 'real-admin', password: 'real-password' } }), realOnPreview);
  assert.equal(realOnPreview.statusCode, 401);
});
