import { showToast } from "./toast";
import { useAuth } from "./context/AuthContext";
import { useMain } from "./context/MainContext";
import api from "./api";

export const HASHTAG_PATTERN = /(^|\s)#([A-Za-z0-9_]+)/g;
export const slugifyText = (value = "", fallback = "item") =>
    String(value || fallback)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || fallback;

// Hook that returns a helper function which checks whether the current
// user (from AuthContext) is signed in. If not, it shows a toast and
// optionally opens the login prompt (loginPrompt callback). If the user
// is signed in this helper will redirect to /create (preserving previous
// behavior).
export const useHandleCheckLogin = () => {
    const { user } = useAuth();
    const { setLoginModal } = useMain()

    return () => {
        if (!user) {
            showToast("Please login first", "error");
            setLoginModal(true);
            return false
        }
        return true
    };
};

export const loadBlogs = async ({ page = 1, limit = 3, search = "", setBlogs, setLoading, setTotalPages }) => {
    setLoading(true);
    try {
        const res = await api.get(`/blogs?page=${page}&limit=${limit}&search=${search}`);
        // return { "blogs": res.data.blogs, "totalPages": res.data.totalPages }
        setBlogs(res.data?.blogs || []);
        setTotalPages(res.data?.pagination?.totalPages);
    } catch (err) {
        console.error("Fetch Error:", err);
    } finally {
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    }
};

export const fetchBlogCategories = async () => {
    const res = await api.get("/categories");
    const categories = res.data?.categories || [];
    return categories.map((item) => item.name).filter(Boolean);
};

export const fetchBlogCategoryStats = async () => {
    const res = await api.get("/categories");
    const categories = res.data?.categories || [];
    return categories.map((item) => ({
        name: item.name,
        count: Number(item.count || 0),
    }));
};

export const fetchHashtagSuggestions = async (query = "") => {
    const res = await api.get(`/hashtags?q=${encodeURIComponent(query)}`);
    return Array.isArray(res.data) ? res.data : [];
};

export const withFreeHashtagSuggestion = (items = [], query = "") => {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    if (!normalizedQuery) return items;

    const exists = items.some((item) => String(item?.name || "").toLowerCase() === normalizedQuery);
    if (exists) return items;

    return [{ name: normalizedQuery, count: 0 }, ...items];
};

export const extractHashtags = (value = "") => {
    const found = new Set();
    const text = String(value);
    let match = HASHTAG_PATTERN.exec(text);

    while (match) {
        found.add(match[2].toLowerCase());
        match = HASHTAG_PATTERN.exec(text);
    }

    HASHTAG_PATTERN.lastIndex = 0;
    return [...found];
};

export const splitTextByHashtags = (value = "") =>
    String(value).split(/(#[A-Za-z0-9_]+)/g);
