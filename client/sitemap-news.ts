// app/sitemap-news.ts (served at /sitemap-news.xml)
// Submits recent articles to Google News & Discover.
// Only include posts from the last 48 hours.

const BASE_URL = "https://minewords.com";

async function getRecentPosts() {
  const res = await fetch(`${BASE_URL}/api/blogs?page=1&limit=50`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const payload = await res.json();
  return payload?.blogs || [];
}

export async function GET() {
  const posts = await getRecentPosts();

  // Filter: only posts from last 48 hours
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const recentPosts = posts.filter(
    (post: { createdAt: string }) => new Date(post.createdAt) > twoDaysAgo,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${recentPosts
  .map(
    (post: { slug: string; title: string; createdAt: string }) => `  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>MineWords</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(post.createdAt).toISOString()}</news:publication_date>
      <news:title>${post.title}</news:title>
    </news:news>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

// Submit this URL in Google Search Console:
// https://minewords.com/sitemap-news.xml
