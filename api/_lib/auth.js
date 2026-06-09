import crypto from 'crypto';

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || 'adtanmoy95@gmail.com';
}

export function verifyCredentials(email, password) {
  const adminEmail = getAdminEmail();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return email?.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword;
}

export function createSessionToken(email) {
  const payload = {
    email: email.toLowerCase(),
    exp: Date.now() + SESSION_MAX_AGE_MS,
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'change-me';
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function parseSessionToken(token) {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'change-me';
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/admin_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookie(token) {
  return `admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_MS / 1000}`;
}
