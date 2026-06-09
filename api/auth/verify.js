import { getTokenFromRequest, parseSessionToken, getAdminEmail } from '../_lib/auth.js';
import { getGitHubConfig } from '../_lib/github.js';

export default async function handler(req, res) {
  const token = getTokenFromRequest(req);
  const session = parseSessionToken(token);

  let serverReady = false;
  try {
    getGitHubConfig();
    serverReady = true;
  } catch {
    serverReady = false;
  }

  if (!session) {
    return res.status(200).json({
      authenticated: false,
      serverMode: serverReady,
      adminEmail: getAdminEmail(),
    });
  }

  return res.status(200).json({
    authenticated: true,
    serverMode: serverReady,
    adminEmail: getAdminEmail(),
    email: session.email,
  });
}
