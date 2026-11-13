import { getCollection } from 'astro:content';

const escapeXml = value => String(value ?? '').replace(/[<>&'\"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

export async function GET() {
  const posts = (await getCollection('blog')).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  const items = posts.map(post => `<item><title>${escapeXml(post.data.title)}</title><link>https://tanmoy095.github.io/blog/${encodeURIComponent(post.id)}/</link><guid>https://tanmoy095.github.io/blog/${encodeURIComponent(post.id)}/</guid><description>${escapeXml(post.data.description)}</description><pubDate>${post.data.pubDate.toUTCString()}</pubDate></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Aunmoy Dey Tanmoy — Engineering Notes</title><link>https://tanmoy095.github.io/</link><description>Articles on Go, backend systems and distributed architecture.</description>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
