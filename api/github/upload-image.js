import { getTokenFromRequest, parseSessionToken } from '../_lib/auth.js';
import { githubRequest, getGitHubConfig } from '../_lib/github.js';

export default async function handler(req, res) {
  const session = parseSessionToken(getTokenFromRequest(req));
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, contentBase64, message } = req.body || {};
    if (!filename || !contentBase64) {
      return res.status(400).json({ error: 'filename and contentBase64 are required' });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `public/blog-assets/${safeName}`;
    const { branch } = getGitHubConfig();

    let sha;
    try {
      const existing = await githubRequest(`${path}?ref=${branch}`);
      sha = existing.sha;
    } catch {
      sha = undefined;
    }

    const data = await githubRequest(path, {
      method: 'PUT',
      body: JSON.stringify({
        message: message || `cms: upload image ${safeName}`,
        content: contentBase64,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    const publicPath = `/blog-assets/${safeName}`;
    return res.status(200).json({ success: true, path: publicPath, sha: data.content?.sha });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Image upload failed' });
  }
}
