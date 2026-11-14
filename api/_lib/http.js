const DEFAULT_ORIGINS = ['https://tanmoy095.github.io', 'http://localhost:4321', 'http://127.0.0.1:4321'];

export function setCors(req, res) {
  const allowed = (process.env.CMS_ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(',')).split(',').map(x => x.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

export function clientKey(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

export function validContentPath(path) {
  return typeof path === 'string' && !path.includes('..') && !path.startsWith('/') && !path.includes('\\') &&
    (/^(src\/data\/(profile|projects)\.json|src\/content\/(blog|learning|knowledge)\/[a-z0-9][a-z0-9-]*\.md|public\/(blog-assets|profile-assets|research-assets|travel-assets|book-assets|personal-assets)\/[a-zA-Z0-9._-]+|public\/cv\.pdf)$/.test(path) || ['src/content/knowledge', 'src/content/blog', 'src/content/learning'].includes(path));
}

export const isContentDirectory = path => ['src/content/knowledge', 'src/content/blog', 'src/content/learning'].includes(path);
