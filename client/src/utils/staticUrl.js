import { getStaticOrigin } from "../config/runtime";

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
    const protocol =
      typeof window !== "undefined" ? window.location.protocol : "https:";
    return `${protocol}${raw}`;
  }

  const browserOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  const fallbackOrigin = getStaticOrigin(apiBase);
  const origin = fallbackOrigin || browserOrigin;

  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  const normalizedPath = stripApiPrefix(withLeadingSlash);
  return origin ? `${origin}${normalizedPath}` : normalizedPath;
};

