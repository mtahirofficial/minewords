// app/sitemap.ts
// Next.js generates /sitemap.xml automatically from this file.
// Every time a new post is published, it appears here instantly.

import { MetadataRoute } from "next";
import { getServerApiBaseUrl, getSiteOrigin } from "./src/config/runtime";

const BASE_URL = getSiteOrigin();
const SERVER_API_BASE_URL = getServerApiBaseUrl();

async function getAllPosts() {
  const apiCandidates = [
    SERVER_API_BASE_URL,
    `${BASE_URL}/api`,
  ].filter(Boolean);

  for (const apiBase of apiCandidates) {
    try {
      const res = await fetch(`${apiBase}/blogs?page=1&limit=1000`, {
        next: { revalidate: 3600 }, // refresh sitemap every hour
      });
      if (!res.ok) continue;

      const payload = await res.json();
      const blogs = Array.isArray(payload?.blogs) ? payload.blogs : [];
      if (blogs.length > 0) return blogs;
    } catch (_error) {
      // Try the next candidate base URL.
    }
  }

  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Fetch all published blog posts
  const posts = await getAllPosts();

  // 2. Build dynamic URLs for each post
  const postUrls = posts.map(
    (post: { slug: string; updatedAt?: string; createdAt: string }) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  );

  // 3. Static pages — always included
  const staticPages = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  // 4. Merge static + dynamic
  return [...staticPages, ...postUrls];
}

// After deploy, your sitemap is live at:
// https://minewords.com/sitemap.xml
