import sharp from 'sharp';
import { getTokenFromRequest, parseSessionToken } from '../_lib/auth.js';
import { githubRequest, getGitHubConfig } from '../_lib/github.js';
import { setCors } from '../_lib/http.js';

const TARGETS = new Set(['blog-assets', 'profile-assets', 'research-assets', 'travel-assets', 'book-assets', 'personal-assets']);

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (!parseSessionToken(getTokenFromRequest(req))) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { filename, contentBase64, message, target = 'blog-assets' } = req.body || {};
    if (typeof filename !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,120}\.(png|jpe?g|webp)$/i.test(filename) || !TARGETS.has(target) || typeof contentBase64 !== 'string' || contentBase64.length > 4_000_000 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(contentBase64)) {
      return res.status(400).json({ error: 'A safe filename, supported target, and bounded base64 image are required.' });
    }

    const bytes = Buffer.from(contentBase64, 'base64');
    let normalized;
    try {
      const processor = sharp(bytes, { limitInputPixels: 40_000_000, failOn: 'error' });
      const metadata = await processor.metadata();
      const extension = filename.split('.').pop().toLowerCase().replace('jpg', 'jpeg');
      if (!['jpeg', 'png', 'webp'].includes(metadata.format) || extension !== metadata.format) {
        return res.status(400).json({ error: 'The filename extension must match a valid JPEG, PNG, or WebP image.' });
      }
      // Re-encoding without keepMetadata() removes EXIF, GPS and embedded profiles.
      normalized = await processor.rotate().toFormat(metadata.format).toBuffer();
      if (normalized.length > 2_800_000) return res.status(413).json({ error: 'The processed image must be smaller than 2.8 MB.' });
    } catch {
      return res.status(400).json({ error: 'The image is invalid or could not be safely processed.' });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `public/${target}/${safeName}`;
    const { branch } = getGitHubConfig();
    let sha;
    try {
      const existing = await githubRequest(`${path}?ref=${branch}`);
      sha = existing.sha;
    } catch (error) {
      if (!/404|Not Found/i.test(error.message)) throw error;
    }
    const data = await githubRequest(path, {
      method: 'PUT',
      body: JSON.stringify({
        message: message || `cms: upload ${target}/${safeName}`,
        content: normalized.toString('base64'),
        branch,
        ...(sha ? { sha } : {}),
      }),
    });
    return res.status(200).json({ success: true, path: `/${target}/${safeName}`, sha: data.content?.sha });
  } catch {
    return res.status(502).json({ error: 'Image upload could not be saved to the content repository.' });
  }
}
