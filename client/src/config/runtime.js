const trim = (value = "") => String(value || "").trim();

const trimTrailingSlash = (value = "") => trim(value).replace(/\/$/, "");

const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(trim(value));

const joinUrl = (origin = "", path = "") => {
  const safeOrigin = trimTrailingSlash(origin);
  const safePath = String(path || "").startsWith("/")
    ? String(path || "")
    : `/${String(path || "")}`;
  return `${safeOrigin}${safePath}`;
};

export const getSiteOrigin = () =>
  trimTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VITE_SITE_URL ||
      "https://minewords.com",
  );

export const getBrowserApiBaseUrl = () => {
  const value = trim(process.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL);
  return value || "/api";
};

export const getServerApiOrigin = () => {
  const candidates = [
    process.env.VITE_API_PROXY_TARGET,
    process.env.NEXT_PUBLIC_API_PROXY_TARGET,
    process.env.API_ORIGIN,
    process.env.HOST,
  ];

  for (const raw of candidates) {
    const value = trimTrailingSlash(raw);
    if (isAbsoluteUrl(value)) return value;
  }

  return "http://localhost:9000";
};

export const getServerApiBaseUrl = () => {
  const rawBase = trim(process.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL);
  if (isAbsoluteUrl(rawBase)) return trimTrailingSlash(rawBase);

  const origin = getServerApiOrigin();
  if (!rawBase) return joinUrl(origin, "/api");

  if (rawBase.startsWith("/")) return joinUrl(origin, rawBase);
  if (rawBase.startsWith("api")) return joinUrl(origin, `/${rawBase}`);

  return joinUrl(origin, "/api");
};

export const getStaticOrigin = (apiBase = "") => {
  const staticOrigin = trim(process.env.VITE_STATIC_ORIGIN);
  if (isAbsoluteUrl(staticOrigin)) return trimTrailingSlash(staticOrigin);

  const apiBaseValue = trim(apiBase);
  if (isAbsoluteUrl(apiBaseValue)) {
    try {
      return new URL(apiBaseValue).origin;
    } catch (_error) {
      // no-op
    }
  }

  const proxyTarget = trim(process.env.VITE_API_PROXY_TARGET);
  if (isAbsoluteUrl(proxyTarget)) return trimTrailingSlash(proxyTarget);

  return "";
};

