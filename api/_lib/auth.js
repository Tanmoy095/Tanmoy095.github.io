import crypto from 'node:crypto';
import { isRedisConfigured, redisCommand } from './redis.js';

const SESSION_MAX_AGE_MS = 30 * 60 * 1000;
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
export { isRedisConfigured };

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

export async function isRateLimited(key) {
  const identifier = crypto.createHash('sha256').update(key).digest('hex');
  const redisKey = `cms:login-rate:${identifier}`;
  const script = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n";
  const count = await redisCommand('EVAL', script, 1, redisKey, RATE_LIMIT_WINDOW_SECONDS);
  return Number(count) > 8;
}
export async function clearRateLimit(key) {
  const identifier = crypto.createHash('sha256').update(key).digest('hex');
  await redisCommand('DEL', `cms:login-rate:${identifier}`);
}

export function createSessionToken(email) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('CMS session signing is not configured');
  const payload = { email: email.toLowerCase(), exp: Date.now() + SESSION_MAX_AGE_MS, nonce: crypto.randomBytes(16).toString('hex') };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`;
}

export async function parseSessionToken(token) {
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
    if (payload.email !== getAdminEmail().toLowerCase() || !Number.isFinite(payload.exp) || Date.now() >= payload.exp || !/^[a-f0-9]{32}$/.test(payload.nonce || '')) return null;
    if (await redisCommand('GET', `cms:revoked:${payload.nonce}`)) return null;
    return payload;
  } catch { return null; }
}

export async function revokeSession(session) {
  if (!session?.nonce || !Number.isFinite(session.exp)) return false;
  const remainingSeconds = Math.max(1, Math.ceil((session.exp - Date.now()) / 1000));
  await redisCommand('SET', `cms:revoked:${session.nonce}`, '1', 'EX', remainingSeconds);
  return true;
}

export function getTokenFromRequest(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}
