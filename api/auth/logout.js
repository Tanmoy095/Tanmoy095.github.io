import { setCors } from '../_lib/http.js';
import { getTokenFromRequest, parseSessionToken } from '../_lib/auth.js';
export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!parseSessionToken(getTokenFromRequest(req))) return res.status(401).json({ error: 'Unauthorized' });
  return res.status(200).json({ success: true });
}
