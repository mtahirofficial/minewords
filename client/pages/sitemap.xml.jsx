const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.VITE_SITE_URL ||
  "https://minewords.com";

const API_ORIGIN =
  process.env.VITE_API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_PROXY_TARGET ||
  process.env.API_ORIGIN ||
  "http://localhost:9000";

const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toIso = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
};

async function fetchPosts() {
  try {
    const response = await fetch(`${API_ORIGIN}/api/blogs?page=1&limit=1000`);
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload?.blogs) ? payload.blogs : [];
  } catch (_error) {
    return [];
  }
}

function buildSitemapXml(posts = []) {
  const now = new Date().toISOString();
  const staticPages = [
    { loc: `${SITE_URL}/`, lastmod: now, changefreq: "daily", priority: "1.0" },
    {
      loc: `${SITE_URL}/categories`,
      lastmod: now,
      changefreq: "daily",
      priority: "0.9",
    },
    { loc: `${SITE_URL}/about`, lastmod: now, changefreq: "monthly", priority: "0.5" },
    { loc: `${SITE_URL}/contact`, lastmod: now, changefreq: "monthly", priority: "0.5" },
    { loc: `${SITE_URL}/faqs`, lastmod: now, changefreq: "monthly", priority: "0.5" },
  ];

  const postPages = posts
    .filter((post) => post?.slug)
    .map((post) => ({
      loc: `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`,
      lastmod: toIso(post.updatedAt || post.createdAt),
      changefreq: "weekly",
      priority: "0.8",
    }));

  const urls = [...staticPages, ...postPages]
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  const posts = await fetchPosts();
  const xml = buildSitemapXml(posts);

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function SitemapXml() {
  return null;
}
