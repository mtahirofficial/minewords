import { getSiteOrigin } from "../src/config/runtime";

const buildRobotsTxt = () => {
  const siteOrigin = getSiteOrigin();

  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /admin/",
    "Disallow: /_next/",
    "Disallow: /dashboard/",
    "",
    "User-agent: GPTBot",
    "Disallow: /",
    "",
    "User-agent: CCBot",
    "Disallow: /",
    "",
    `Sitemap: ${siteOrigin}/sitemap.xml`,
    "",
  ].join("\n");
};

export async function getServerSideProps({ res }) {
  const robotsTxt = buildRobotsTxt();

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.write(robotsTxt);
  res.end();

  return { props: {} };
}

export default function RobotsTxt() {
  return null;
}
