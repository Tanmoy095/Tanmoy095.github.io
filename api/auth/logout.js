import { setCors } from '../_lib/http.js';
import { getTokenFromRequest, parseSessionToken, revokeSession } from '../_lib/auth.js';
export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const session = await parseSessionToken(getTokenFromRequest(req));
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  try { await revokeSession(session); }
  catch { return res.status(503).json({ error: 'Session revocation service is temporarily unavailable.' }); }
  return res.status(200).json({ success: true });
}
