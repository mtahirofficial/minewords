import axios from "axios";
import { getBrowserApiBaseUrl } from "./config/runtime";

const apiBaseUrl = getBrowserApiBaseUrl();
const includeAuthOnPublicReads =
  process.env.VITE_API_INCLUDE_AUTH_ON_PUBLIC_READS === "true";
const publicReadPatterns = [
  /^\/blogs(?:\/|$)/,
  /^\/hashtags(?:\/|$)/,
  /^\/categories(?:\/|$)/,
];

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

// Dedicated client for refresh calls to avoid interceptor recursion.
const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : "";
    const forceAuth = Boolean(config?._forceAuth);
    const method = String(config.method || "get").toLowerCase();
    const rawUrl = String(config.url || "");
    const pathname = rawUrl.startsWith("http")
      ? new URL(rawUrl).pathname
      : rawUrl;
    const isPublicRead =
      method === "get" &&
      publicReadPatterns.some((pattern) => pattern.test(pathname));

    if (token && (forceAuth || includeAuthOnPublicReads || !isPublicRead)) {
      if (!config.headers) config.headers = {};
      config.headers["Authorization"] = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const rawUrl = String(originalRequest.url || "");
    const pathname = rawUrl.startsWith("http") ? new URL(rawUrl).pathname : rawUrl;
    const isRefreshRequest = pathname === "/auth/refresh-token";

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;

      try {
        const refreshRes = await refreshClient.post("/auth/refresh-token");
        const nextToken = refreshRes?.data?.data?.accessToken || "";

        if (typeof window !== "undefined" && nextToken) {
          localStorage.setItem("accessToken", nextToken);
        }

        if (!originalRequest.headers) originalRequest.headers = {};
        originalRequest.headers["Authorization"] = `Bearer ${nextToken}`;
        return api(originalRequest);
      } catch (err) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(err);
      }
    }

    // If refresh itself is unauthorized, hard logout once (no retry).
    if (error.response && error.response.status === 401 && isRefreshRequest) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;

