const stripApiPrefix = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";

  if (/^\/api(\/|$)/i.test(normalized)) {
    return normalized.replace(/^\/api/i, "") || "/";
  }

  if (/^api(\/|$)/i.test(normalized)) {
    return `/${normalized.replace(/^api/i, "")}` || "/";
  }

  return normalized;
};

export const resolveStaticFileUrl = (value = "", apiBase = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (
    /^https?:\/\//i.test(raw) ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  if (raw.startsWith("//")) {
    return `${window.location.protocol}${raw}`;
  }

  let origin = window.location.origin;
  const base = String(apiBase || "").trim();
  const staticOrigin = String(import.meta.env.VITE_STATIC_ORIGIN || "").trim();
  const proxyTarget = String(import.meta.env.VITE_API_PROXY_TARGET || "").trim();
  if (staticOrigin && /^https?:\/\//i.test(staticOrigin)) {
    try {
      origin = new URL(staticOrigin).origin;
    } catch (_error) {
      origin = window.location.origin;
    }
  } else if (base && /^https?:\/\//i.test(base)) {
    try {
      origin = new URL(base).origin;
    } catch (_error) {
      origin = window.location.origin;
    }
  } else if (import.meta.env.DEV && proxyTarget && /^https?:\/\//i.test(proxyTarget)) {
    try {
      origin = new URL(proxyTarget).origin;
    } catch (_error) {
      origin = window.location.origin;
    }
  }

  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  const normalizedPath = stripApiPrefix(withLeadingSlash);
  return `${origin}${normalizedPath}`;
};
