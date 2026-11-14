import { getTokenFromRequest, parseSessionToken } from '../_lib/auth.js';
import { githubRequest, getGitHubConfig } from '../_lib/github.js';
import { setCors, validContentPath, isContentDirectory } from '../_lib/http.js';

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  const session = parseSessionToken(getTokenFromRequest(req));
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { branch } = getGitHubConfig();

    if (req.method === 'GET') {
      const path = req.query.path;
      if (!validContentPath(path)) return res.status(400).json({ error: 'Unsupported content path' });
      const ref = req.query.ref || branch;
      const data = await githubRequest(`${path}?ref=${ref}`);
      return res.status(200).json(data);
    }

    if (req.method === 'PUT' || req.method === 'DELETE') {
      const { path, message, content, sha } = req.body || {};
      if (!validContentPath(path) || isContentDirectory(path) || !message || (req.method === 'PUT' && (typeof content !== 'string' || !content)) || (req.method === 'DELETE' && !sha)) {
        return res.status(400).json({ error: 'Valid path, message, content, and current file SHA are required' });
      }
      if (req.method === 'PUT' && (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(content) || content.length > 12_000_000)) {
        return res.status(400).json({ error: 'File content must be valid bounded base64.' });
      }
      if (req.method === 'PUT' && path === 'public/cv.pdf' && !Buffer.from(content, 'base64').subarray(0, 5).equals(Buffer.from('%PDF-'))) {
        return res.status(400).json({ error: 'The CV upload must be a valid PDF file.' });
      }
      if (req.method === 'PUT' && path.startsWith('src/content/knowledge/') && /(?:^|\n)status:\s*(?:"private"|'private'|private)\s*(?:\n|$)/i.test(Buffer.from(content, 'base64').toString('utf8'))) {
        return res.status(400).json({ error: 'Private entries cannot be saved in the public content repository.' });
      }

      const body = { message, branch, ...(sha ? { sha } : {}), ...(content ? { content } : {}) };
      const data = await githubRequest(path, {
        method: req.method,
        body: JSON.stringify(body),
      });
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const status = /sha|already exists|does not match/i.test(err.message) ? 409 : 502;
    return res.status(status).json({ error: status === 409 ? 'Content changed on GitHub. Reload the item and retry.' : 'GitHub content service is temporarily unavailable.' });
  }
}
