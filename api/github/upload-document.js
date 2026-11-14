import { getTokenFromRequest, parseSessionToken } from '../_lib/auth.js';
import { githubRequest, getGitHubConfig } from '../_lib/github.js';
import { setCors } from '../_lib/http.js';

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (!parseSessionToken(getTokenFromRequest(req))) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { filename, contentBase64 } = req.body || {};
  if (typeof filename !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,120}\.pdf$/i.test(filename) || typeof contentBase64 !== 'string' || contentBase64.length > 4_000_000 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(contentBase64)) {
    return res.status(400).json({ error: 'A safe PDF filename and bounded base64 file are required.' });
  }
  const bytes = Buffer.from(contentBase64, 'base64');
  if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) return res.status(400).json({ error: 'The uploaded document is not a valid PDF.' });
  const path = `public/research-assets/${filename}`;
  try {
    const { branch } = getGitHubConfig();
    let sha;
    try { sha = (await githubRequest(`${path}?ref=${branch}`)).sha; }
    catch (error) { if (!/404|Not Found/i.test(error.message)) throw error; }
    const result = await githubRequest(path, { method: 'PUT', body: JSON.stringify({ message: `cms: upload research document ${filename}`, content: contentBase64, branch, ...(sha ? { sha } : {}) }) });
    return res.status(200).json({ success: true, path: `/research-assets/${filename}`, sha: result.content?.sha });
  } catch {
    return res.status(502).json({ error: 'Research document could not be saved to the content repository.' });
  }
}
