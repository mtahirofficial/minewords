// api.js
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || "/api";
const includeAuthOnPublicReads =
    import.meta.env.VITE_API_INCLUDE_AUTH_ON_PUBLIC_READS === "true";
const publicReadPatterns = [
    /^\/blogs(?:\/|$)/,
    /^\/hashtags(?:\/|$)/,
    /^\/categories(?:\/|$)/
];

const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,            // cookies bhejne ke liye zaruri
});

// Request interceptor: attach access token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
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
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401 & refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Agar 401 hai aur request pehle retry nahi hui
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true; // mark as retried

            try {
                // Call refresh token endpoint
                const refreshRes = await api.post("/auth/refresh-token");

                // Save new access token
                localStorage.setItem("accessToken", refreshRes.data.data.accessToken);

                // Retry original request with new token
                originalRequest.headers["Authorization"] =
                    "Bearer " + refreshRes.data.data.accessToken;

                return api(originalRequest);
            } catch (err) {
                // Refresh failed → logout user
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
