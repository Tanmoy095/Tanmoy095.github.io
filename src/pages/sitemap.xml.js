import { getCollection } from 'astro:content';

export async function GET() {
  const routes = ['/', '/about/', '/projects/', '/blog/', '/learning/', ...(await getCollection('blog')).map(post => `/blog/${post.id}/`), ...(await getCollection('learning')).map(entry => `/learning/${entry.id}/`)];
  const urls = routes.map(path => `<url><loc>${new URL(path, 'https://tanmoy095.github.io').toString()}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
