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

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

let refreshPromise = null;

api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : "";
    const method = String(config.method || "get").toLowerCase();
    const rawUrl = String(config.url || "");
    const pathname = rawUrl.startsWith("http")
      ? new URL(rawUrl).pathname
      : rawUrl;
    const isPublicRead =
      method === "get" &&
      publicReadPatterns.some((pattern) => pattern.test(pathname));

    if (token && (includeAuthOnPublicReads || !isPublicRead)) {
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
    const isAuthMeRequest = pathname === "/auth/me";

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshClient
            .post("/auth/refresh-token")
            .then((refreshRes) => refreshRes?.data?.data?.accessToken || "")
            .finally(() => {
              refreshPromise = null;
            });
        }

        const nextToken = await refreshPromise;

        if (typeof window !== "undefined" && nextToken) {
          localStorage.setItem("accessToken", nextToken);
        }

        if (!originalRequest.headers) originalRequest.headers = {};
        if (nextToken) {
          originalRequest.headers["Authorization"] = `Bearer ${nextToken}`;
        }
        return api(originalRequest);
      } catch (err) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          // Avoid redirect loops; let the current navigation finish if already on login.
          if (window.location.pathname !== "/login") {
            window.location.assign("/login");
          }
        }
        return Promise.reject(err);
      }
    }

    // If auth/me itself fails, don't attempt additional recovery here.
    if (error.response && error.response.status === 401 && isAuthMeRequest) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
    }

    return Promise.reject(error);
  },
);

export default api;

