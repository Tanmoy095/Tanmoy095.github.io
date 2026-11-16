import { verifyCredentials, createSessionToken, isRateLimited, clearRateLimit } from '../_lib/auth.js';
import { setCors, clientKey } from '../_lib/http.js';

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const key = clientKey(req);
    if (await isRateLimited(key)) return res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' });
    const { email, password } = req.body || {};
    if (!await verifyCredentials(email, password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await clearRateLimit(key);
    const token = createSessionToken(email);
    return res.status(200).json({
      success: true,
      token,
      mode: 'server',
      message: 'Authenticated. GitHub token is managed server-side.',
    });
  } catch {
    return res.status(503).json({ error: 'CMS authentication is not configured on the server.' });
  }
}
