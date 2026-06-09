import { verifyCredentials, createSessionToken, sessionCookie } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};
    if (!verifyCredentials(email, password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createSessionToken(email);
    res.setHeader('Set-Cookie', sessionCookie(token));
    return res.status(200).json({
      success: true,
      token,
      mode: 'server',
      message: 'Authenticated. GitHub token is managed server-side.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
}
