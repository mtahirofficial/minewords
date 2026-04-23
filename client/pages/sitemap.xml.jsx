import { getServerApiBaseUrl, getSiteOrigin } from "../src/config/runtime";

const SITE_URL = getSiteOrigin();

const trim = (value = "") => String(value || "").trim();
const trimTrailingSlash = (value = "") => trim(value).replace(/\/$/, "");
const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(trim(value));

const toApiBase = (origin = "") => {
  const safeOrigin = trimTrailingSlash(origin);
  if (!safeOrigin || !isAbsoluteUrl(safeOrigin)) return "";
  return `${safeOrigin}/api`;
};

const getRequestOrigin = (req) => {
  const host = trim(req?.headers?.host);
  if (!host) return "";
  const protoHeader = trim(req?.headers?.["x-forwarded-proto"]);
  const protocol = protoHeader || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
};

const buildApiCandidates = (req) => {
  const candidates = [
    getServerApiBaseUrl(),
    toApiBase(process.env.VITE_API_PROXY_TARGET),
    toApiBase(process.env.NEXT_PUBLIC_API_PROXY_TARGET),
    toApiBase(process.env.API_ORIGIN),
    `${SITE_URL}/api`,
    toApiBase(getRequestOrigin(req)),
  ]
    .map((value) => trimTrailingSlash(value))
    .filter(Boolean);

  return [...new Set(candidates)];
};

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

async function fetchPosts(apiCandidates = []) {
  for (const apiBase of apiCandidates) {
    try {
      const response = await fetch(`${apiBase}/blogs?page=1&limit=1000`);
      if (!response.ok) continue;

      const payload = await response.json();
      const blogs = Array.isArray(payload?.blogs) ? payload.blogs : [];
      if (blogs.length > 0) return blogs;
    } catch (_error) {
      // Try the next API candidate.
    }
  }

  return [];
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

export async function getServerSideProps({ req, res }) {
  const posts = await fetchPosts(buildApiCandidates(req));
  const xml = buildSitemapXml(posts);

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function SitemapXml() {
  return null;
}
