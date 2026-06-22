/** @type {import('next-sitemap').IConfig} */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.VITE_SITE_URL ||
  "https://minewords.com";

export default {
  siteUrl,
  generateRobotsTxt: true,
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ["/login", "/signup", "/dashboard*", "/admin*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/login", "/signup", "/admin"],
      },
    ],
    additionalSitemaps: [`${siteUrl}/server-sitemap.xml`],
    transformRobotsTxt: async (_config, robotsTxt) =>
      robotsTxt.replace(/^# Host\nHost:.*\n?/gm, ""),
  },
};
