import { getTokenFromRequest, parseSessionToken } from '../_lib/auth.js';
import { githubRequest, getGitHubConfig } from '../_lib/github.js';

export default async function handler(req, res) {
  const session = parseSessionToken(getTokenFromRequest(req));
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { branch } = getGitHubConfig();

    if (req.method === 'GET') {
      const path = req.query.path;
      if (!path) return res.status(400).json({ error: 'path is required' });
      const ref = req.query.ref || branch;
      const data = await githubRequest(`${path}?ref=${ref}`);
      return res.status(200).json(data);
    }

    if (req.method === 'PUT' || req.method === 'DELETE') {
      const { path, message, content, sha } = req.body || {};
      if (!path || !message) {
        return res.status(400).json({ error: 'path and message are required' });
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
    return res.status(500).json({ error: err.message || 'GitHub proxy error' });
  }
}
