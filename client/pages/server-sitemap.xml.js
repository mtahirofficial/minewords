import { getServerApiBaseUrl, getSiteOrigin } from "../src/config/runtime";
import { getServerSideSitemapLegacy } from "next-sitemap";

const SITE_URL = getSiteOrigin();

const trim = (value = "") => String(value || "").trim();
const trimTrailingSlash = (value = "") => trim(value).replace(/\/$/, "");
const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(trim(value));

const toApiBase = (origin = "") => {
  const safeOrigin = trimTrailingSlash(origin);
  if (!safeOrigin || !isAbsoluteUrl(safeOrigin)) return "";
  return `${safeOrigin}/api`;
};

const buildApiCandidates = (req) => {
  const host = trim(req?.headers?.host);
  const protoHeader = trim(req?.headers?.["x-forwarded-proto"]);
  const requestOrigin = host
    ? `${protoHeader || (host.includes("localhost") ? "http" : "https")}://${host}`
    : "";

  return [
    getServerApiBaseUrl(),
    toApiBase(process.env.VITE_API_PROXY_TARGET),
    toApiBase(process.env.NEXT_PUBLIC_API_PROXY_TARGET),
    toApiBase(process.env.API_ORIGIN),
    `${SITE_URL}/api`,
    toApiBase(requestOrigin),
  ]
    .map((value) => trimTrailingSlash(value))
    .filter(Boolean);
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

export async function getServerSideProps({ req, res }) {
  const posts = await fetchPosts(buildApiCandidates(req));

  const fields = posts
    .filter((post) => post?.slug)
    .map((post) => ({
      loc: `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`,
      lastmod: post.updatedAt || post.createdAt || new Date().toISOString(),
      changefreq: "monthly",
      priority: 0.8,
    }));

  return getServerSideSitemapLegacy({ req, res }, fields);
}

export default function ServerSitemap() {
  return null;
}
