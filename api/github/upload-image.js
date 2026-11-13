import { getTokenFromRequest, parseSessionToken } from '../_lib/auth.js';
import { githubRequest, getGitHubConfig } from '../_lib/github.js';
import { setCors } from '../_lib/http.js';

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  const session = parseSessionToken(getTokenFromRequest(req));
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, contentBase64, message } = req.body || {};
    if (typeof filename !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,120}\.(png|jpe?g|webp|gif)$/i.test(filename) || typeof contentBase64 !== 'string' || contentBase64.length > 8_000_000 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(contentBase64)) {
      return res.status(400).json({ error: 'filename and contentBase64 are required' });
    }
    const bytes = Buffer.from(contentBase64, 'base64');
    const validImage = (/\.png$/i.test(filename) && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ||
      (/\.jpe?g$/i.test(filename) && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
      (/\.gif$/i.test(filename) && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString())) ||
      (/\.webp$/i.test(filename) && bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP');
    if (!bytes.length || !validImage) return res.status(400).json({ error: 'The filename extension does not match a supported image file.' });

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `public/blog-assets/${safeName}`;
    const { branch } = getGitHubConfig();

    let sha;
    try {
      const existing = await githubRequest(`${path}?ref=${branch}`);
      sha = existing.sha;
    } catch (error) {
      if (!/404|Not Found/i.test(error.message)) throw error;
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
