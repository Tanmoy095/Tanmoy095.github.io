import { getTokenFromRequest, parseSessionToken } from '../_lib/auth.js';
import { redisCommand } from '../_lib/redis.js';
import { setCors } from '../_lib/http.js';

const PRIVATE_ENTRIES_KEY = 'cms:private-knowledge';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRIVATE_STATUS = /(?:^|\n)status:\s*(?:"private"|'private'|private)\s*(?:\n|$)/i;

function response(res, status, body) { return res.status(status).json(body); }

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  const session = await parseSessionToken(getTokenFromRequest(req));
  if (!session) return response(res, 401, { error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const result = await redisCommand('HGETALL', PRIVATE_ENTRIES_KEY);
      const entries = [];
      if (Array.isArray(result)) {
        for (let i = 0; i < result.length; i += 2) entries.push({ slug: result[i], content: result[i + 1] });
      } else if (result && typeof result === 'object') {
        for (const [slug, content] of Object.entries(result)) entries.push({ slug, content });
      }
      return response(res, 200, { entries });
    }

    const { slug, content } = req.body || {};
    if (typeof slug !== 'string' || !SLUG.test(slug)) return response(res, 400, { error: 'A valid lowercase content slug is required.' });

    if (req.method === 'DELETE') {
      const deleted = await redisCommand('HDEL', PRIVATE_ENTRIES_KEY, slug);
      return deleted ? response(res, 200, { success: true }) : response(res, 404, { error: 'Private entry not found.' });
    }

    if (!['POST', 'PUT'].includes(req.method)) return response(res, 405, { error: 'Method not allowed' });
    if (typeof content !== 'string' || !content.trim() || Buffer.byteLength(content, 'utf8') > 500_000 || !PRIVATE_STATUS.test(content)) {
      return response(res, 400, { error: 'Private entries must contain private status and remain under 500 KB.' });
    }

    const exists = Number(await redisCommand('HEXISTS', PRIVATE_ENTRIES_KEY, slug)) === 1;
    if (req.method === 'POST' && exists) return response(res, 409, { error: 'A private entry with this slug already exists.' });
    if (req.method === 'PUT' && !exists) return response(res, 404, { error: 'Private entry not found.' });
    await redisCommand('HSET', PRIVATE_ENTRIES_KEY, slug, content);
    return response(res, req.method === 'POST' ? 201 : 200, { success: true, slug });
  } catch {
    return response(res, 503, { error: 'Private content storage is unavailable.' });
  }
}
