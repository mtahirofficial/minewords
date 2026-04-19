import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: process.env.VITE_ENABLE_STRICT_MODE === "true",
  turbopack: {
    root: __dirname,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_PROXY_TARGET: process.env.NEXT_PUBLIC_API_PROXY_TARGET,
    VITE_ENABLE_STRICT_MODE: process.env.VITE_ENABLE_STRICT_MODE,
    VITE_API_URL: process.env.VITE_API_URL,
    VITE_API_PROXY_TARGET: process.env.VITE_API_PROXY_TARGET,
    VITE_API_INCLUDE_AUTH_ON_PUBLIC_READS:
      process.env.VITE_API_INCLUDE_AUTH_ON_PUBLIC_READS,
    VITE_SITE_NAME: process.env.VITE_SITE_NAME,
    VITE_STATIC_ORIGIN: process.env.VITE_STATIC_ORIGIN,
    VITE_HOME_FETCH_META_ON_LOAD: process.env.VITE_HOME_FETCH_META_ON_LOAD,
    VITE_ADSENSE_CLIENT: process.env.VITE_ADSENSE_CLIENT,
    VITE_ADSENSE_SLOT_HOME_INLINE: process.env.VITE_ADSENSE_SLOT_HOME_INLINE,
    VITE_ADSENSE_SLOT_HOME_SIDEBAR: process.env.VITE_ADSENSE_SLOT_HOME_SIDEBAR,
    VITE_ADSENSE_SLOT_BLOG_INLINE: process.env.VITE_ADSENSE_SLOT_BLOG_INLINE,
    VITE_ADSENSE_SLOT_BLOG_FOOTER: process.env.VITE_ADSENSE_SLOT_BLOG_FOOTER,
  },
  async rewrites() {
    const target =
      process.env.VITE_API_PROXY_TARGET ||
      process.env.NEXT_PUBLIC_API_PROXY_TARGET ||
      "";
    if (!target.trim()) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
