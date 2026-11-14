import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { createSessionToken, parseSessionToken, verifyCredentials, isRateLimited } from '../api/_lib/auth.js';
import { setCors, validContentPath } from '../api/_lib/http.js';
import proxy from '../api/github/proxy.js';
import loginHandler from '../api/auth/login.js';
import uploadImage from '../api/github/upload-image.js';
import sharp from 'sharp';
import uploadDocument from '../api/github/upload-document.js';

const scrypt = promisify(crypto.scrypt);
const env = { ...process.env };
test.before(async () => {
  const salt = crypto.randomBytes(18);
  const key = await scrypt('a-secure-test-password', salt, 64);
  process.env.ADMIN_EMAIL = 'admin@example.test';
  process.env.ADMIN_PASSWORD_HASH = `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`;
  process.env.ADMIN_SESSION_SECRET = crypto.randomBytes(48).toString('base64url');
  process.env.GITHUB_TOKEN = 'test-token';
  process.env.CMS_ALLOWED_ORIGINS = 'https://tanmoy095.github.io,http://localhost:4321';
});
test.after(() => { for (const [key, value] of Object.entries(env)) process.env[key] = value; });

test('scrypt login accepts only matching email and password', async () => {
  assert.equal(await verifyCredentials('ADMIN@example.test', 'a-secure-test-password'), true);
  assert.equal(await verifyCredentials('other@example.test', 'a-secure-test-password'), false);
  assert.equal(await verifyCredentials('admin@example.test', 'wrong-password'), false);
});

test('signed session expires and rejects a modified signature', () => {
  const token = createSessionToken('admin@example.test');
  assert.equal(parseSessionToken(token)?.email, 'admin@example.test');
  assert.equal(parseSessionToken(`${token.slice(0, -1)}x`), null);
  const [body] = token.split('.');
  const expired = Buffer.from(JSON.stringify({ email: 'admin@example.test', exp: Date.now() - 1, nonce: 'n' })).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(expired).digest('base64url');
  assert.equal(parseSessionToken(`${expired}.${signature}`), null);
});

test('write proxy denies requests without a signed session', async () => {
  const req = { method: 'PUT', headers: {}, body: { path: 'src/data/profile.json', content: 'e30=', message: 'test' } };
  const result = { statusCode: 0, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, setHeader() {} };
  await proxy(req, result);
  assert.equal(result.statusCode, 401);
});

test('write proxy refuses private knowledge in the public repository', async () => {
  const token = createSessionToken('admin@example.test');
  const res = fakeResponse();
  const content = Buffer.from('---\ntype: essay\nstatus: private\n---\nsecret').toString('base64');
  await proxy({ method:'PUT', headers:{authorization:`Bearer ${token}`}, body:{path:'src/content/knowledge/secret.md',content,message:'test'} }, res);
  assert.equal(res.statusCode,400);
});

test('content path allowlist accepts CMS data and blocks arbitrary or traversal paths', () => {
  assert.equal(validContentPath('src/data/profile.json'), true);
  assert.equal(validContentPath('src/content/blog/a-valid-post.md'), true);
  assert.equal(validContentPath('package.json'), false);
  assert.equal(validContentPath('src/content/blog/../../package.json'), false);
  assert.equal(validContentPath('https://example.com/file'), false);
});

test('CORS allows configured origins and answers preflight', () => {
  const headers = {};
  const res = { status(code) { this.statusCode = code; return this; }, setHeader(k, v) { headers[k] = v; }, end() { this.ended = true; } };
  assert.equal(setCors({ method: 'OPTIONS', headers: { origin: 'https://tanmoy095.github.io' } }, res), true);
  assert.equal(headers['Access-Control-Allow-Origin'], 'https://tanmoy095.github.io');
  assert.equal(res.statusCode, 204);
  const denied = {};
  setCors({ method: 'GET', headers: { origin: 'https://evil.example' } }, { setHeader(k, v) { denied[k] = v; } });
  assert.equal(denied['Access-Control-Allow-Origin'], undefined);
});

test('login throttling rejects attempts after the threshold', () => {
  const key = `test-${crypto.randomUUID()}`;
  for (let i = 0; i < 8; i++) assert.equal(isRateLimited(key), false);
  assert.equal(isRateLimited(key), true);
});

function fakeResponse() {
  return { statusCode: 0, body: null, headers: {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, setHeader(key, value) { this.headers[key] = value; }, end() { this.ended = true; } };
}

test('login endpoint issues a short-lived bearer session and rejects invalid credentials', async () => {
  const success = fakeResponse();
  await loginHandler({ method: 'POST', headers: { origin: 'https://tanmoy095.github.io', 'x-forwarded-for': crypto.randomUUID() }, body: { email: 'admin@example.test', password: 'a-secure-test-password' } }, success);
  assert.equal(success.statusCode, 200);
  assert.equal(parseSessionToken(success.body.token)?.email, 'admin@example.test');
  const failure = fakeResponse();
  await loginHandler({ method: 'POST', headers: { 'x-forwarded-for': crypto.randomUUID() }, body: { email: 'admin@example.test', password: 'wrong' } }, failure);
  assert.equal(failure.statusCode, 401);
  assert.equal(failure.body.error, 'Invalid email or password');
});

test('image upload rejects invalid image bytes before calling GitHub', async () => {
  const token = createSessionToken('admin@example.test');
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error('unexpected request'); };
  try {
    const res = fakeResponse();
    await uploadImage({ method: 'POST', headers: { authorization: `Bearer ${token}` }, body: { filename: 'not-really.png', contentBase64: Buffer.from('not an image').toString('base64') } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(called, false);
  } finally { globalThis.fetch = originalFetch; }
});

test('duplicate image filenames update the current GitHub SHA', async () => {
  const token = createSessionToken('admin@example.test');
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    if (!options.method || options.method === 'GET') return new Response(JSON.stringify({ sha: 'existing-sha' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ content: { sha: 'updated-sha' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).png().toBuffer();
    const res = fakeResponse();
    await uploadImage({ method: 'POST', headers: { authorization: `Bearer ${token}` }, body: { filename: 'cover.png', contentBase64: png.toString('base64') } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(requests[1].options.body).sha, 'existing-sha');
    const saved = Buffer.from(JSON.parse(requests[1].options.body).content, 'base64');
    assert.equal((await sharp(saved).metadata()).exif, undefined, 'uploaded image should not contain EXIF metadata');
  } finally { globalThis.fetch = originalFetch; }
});

test('research PDF upload validates bytes and stores through GitHub API', async () => {
  const token=createSessionToken('admin@example.test'), originalFetch=globalThis.fetch, requests=[];
  globalThis.fetch=async(url,options)=>{
    requests.push({url,options});
    return !options.method || options.method==='GET'
      ? new Response('Not Found',{status:404})
      : new Response(JSON.stringify({content:{sha:'pdf-sha'}}),{status:201,headers:{'Content-Type':'application/json'}});
  };
  try {
    const res=fakeResponse(), pdf=Buffer.from('%PDF-1.4\nminimal');
    await uploadDocument({method:'POST',headers:{authorization:`Bearer ${token}`},body:{filename:'notes.pdf',contentBase64:pdf.toString('base64')}},res);
    assert.equal(res.statusCode,200);
    assert.equal(res.body.path,'/research-assets/notes.pdf');
    assert.equal(requests.length,2);
  } finally { globalThis.fetch=originalFetch; }
});
