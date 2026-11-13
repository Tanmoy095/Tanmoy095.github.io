import crypto from 'node:crypto';

const SESSION_MAX_AGE_MS = 30 * 60 * 1000;
const attempts = new Map();

export function getAdminEmail() { return process.env.ADMIN_EMAIL || ''; }

export async function verifyCredentials(email, password) {
  const configuredEmail = getAdminEmail();
  const encoded = process.env.ADMIN_PASSWORD_HASH || '';
  const match = /^scrypt\$([A-Za-z0-9_-]{16,})\$([A-Za-z0-9_-]{80,})$/.exec(encoded);
  if (!configuredEmail || !match || typeof password !== 'string' || password.length > 1024) return false;
  const [salt, expected] = [Buffer.from(match[1], 'base64url'), Buffer.from(match[2], 'base64url')];
  if (email?.trim().toLowerCase() !== configuredEmail.trim().toLowerCase()) return false;
  const actual = await new Promise((resolve, reject) => crypto.scrypt(password, salt, expected.length, (err, key) => err ? reject(err) : resolve(key)));
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function isRateLimited(key) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.started > 15 * 60 * 1000) { attempts.set(key, { started: now, count: 1 }); return false; }
  current.count += 1;
  return current.count > 8;
}
export function clearRateLimit(key) { attempts.delete(key); }

export function createSessionToken(email) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('CMS session signing is not configured');
  const payload = { email: email.toLowerCase(), exp: Date.now() + SESSION_MAX_AGE_MS, nonce: crypto.randomBytes(16).toString('hex') };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`;
}

export function parseSessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  const [body, signature, ...extra] = token.split('.');
  if (!body || !signature || extra.length) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.email !== getAdminEmail().toLowerCase() || !Number.isFinite(payload.exp) || Date.now() >= payload.exp) return null;
    return payload;
  } catch { return null; }
}

export function getTokenFromRequest(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}
