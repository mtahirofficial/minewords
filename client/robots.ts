// app/robots.ts
// Next.js serves this at /robots.txt automatically.
// Tells crawlers what to index and where your sitemap is.

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*", // applies to all bots (Google, Bing, etc.)
        allow: "/", // allow everything by default
        disallow: [
          "/api/", // don't index API routes
          "/admin/", // don't index admin pages
          "/_next/", // don't index Next.js internals
          "/dashboard/", // don't index private pages
        ],
      },
      {
        // Block AI training bots (optional but recommended)
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
    ],
    // Point all crawlers to your sitemap
    sitemap: "https://minewords.com/sitemap.xml",
  };
}

// After deploy, verify at:
// https://minewords.com/robots.txt
