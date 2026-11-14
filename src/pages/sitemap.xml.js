import { getCollection } from 'astro:content';

export async function GET() {
  const knowledge = (await getCollection('knowledge')).filter(entry => entry.data.status === 'published');
  const routes = ['/', '/about/', '/projects/', '/blog/', '/learning/', '/academics/', '/academics/research/', '/writing/', '/travel/', '/books/', '/quotes/', '/contact/', ...(await getCollection('blog')).map(post => `/blog/${post.id}/`), ...(await getCollection('learning')).map(entry => `/learning/${entry.id}/`), ...knowledge.flatMap(entry => {
    if (['research', 'research-note'].includes(entry.data.type)) return [`/academics/research/${entry.id}/`];
    if (entry.data.type === 'academic') return [`/academics/${entry.id}/`];
    if (['essay', 'personal-story', 'reflection'].includes(entry.data.type)) return [`/writing/${entry.id}/`];
    if (entry.data.type === 'travel') return [`/travel/${entry.id}/`];
    if (entry.data.type === 'book') return [`/books/${entry.id}/`];
    if (entry.data.type === 'quote') return [`/quotes/${entry.id}/`];
    return [];
  })];
  const urls = routes.map(path => `<url><loc>${new URL(path, 'https://tanmoy095.github.io').toString()}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
