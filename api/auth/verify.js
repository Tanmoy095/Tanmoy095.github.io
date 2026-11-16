import { getTokenFromRequest, parseSessionToken, getAdminEmail, isRedisConfigured } from '../_lib/auth.js';
import { getGitHubConfig } from '../_lib/github.js';
import { setCors } from '../_lib/http.js';

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const token = getTokenFromRequest(req);
  const session = await parseSessionToken(token);

  let serverReady = false;
  try {
    getGitHubConfig();
    serverReady = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_SESSION_SECRET?.length >= 32 && isRedisConfigured());
  } catch {
    serverReady = false;
  }

  if (!serverReady) return res.status(503).json({ authenticated: false, serverMode: false, error: 'CMS server configuration is incomplete. Configure the durable Redis session and rate-limit store.' });

  if (!session) {
    return res.status(200).json({
      authenticated: false,
      serverMode: serverReady,
    });
  }

  return res.status(200).json({
    authenticated: true,
    serverMode: serverReady,
    email: session.email,
  });
}
