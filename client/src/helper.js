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
// user is signed in and (optionally) email-verified before sensitive actions.
export const useHandleCheckLogin = () => {
    const { user } = useAuth();
    const { setLoginModal, setVerificationModal } = useMain()

    return ({ requireVerified = false } = {}) => {
        if (!user) {
            showToast("Please login first", "error");
            setLoginModal(true);
            return false
        }

        if (requireVerified && !user?.isVerified) {
            showToast("Please verify your email to continue", "error");
            setVerificationModal(true);
            return false;
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

const normalizeHashtagSource = (value = "") =>
    String(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ");

export const extractHashtags = (value = "") => {
    const found = new Set();
    const text = normalizeHashtagSource(value);
    const regex = /(^|[^A-Za-z0-9_])#([A-Za-z0-9_]+)/g;
    let match = regex.exec(text);

    while (match) {
        found.add(String(match[2] || "").toLowerCase());
        match = regex.exec(text);
    }

    return [...found];
};

export const extractBlogHashtags = (post = {}) => {
    const values = [
        post?.title || "",
        post?.excerpt || "",
        post?.content || "",
    ];

    if (Array.isArray(post?.tags)) {
        values.push(post.tags.join(" "));
    } else if (typeof post?.tags === "string") {
        values.push(post.tags);
    }

    if (Array.isArray(post?.hashtags)) {
        values.push(post.hashtags.join(" "));
    } else if (typeof post?.hashtags === "string") {
        values.push(post.hashtags);
    }

    const normalizedTags = (() => {
        const source = post?.tags;
        if (Array.isArray(source)) return source;
        if (typeof source === "string") {
            try {
                const parsed = JSON.parse(source);
                if (Array.isArray(parsed)) return parsed;
            } catch (error) {
                return source.split(",");
            }
        }
        return [];
    })()
        .map((item) => String(item || "").trim().replace(/^#+/, "").toLowerCase())
        .filter(Boolean)
        .slice(0, 10);

    if (normalizedTags.length) {
        values.push(normalizedTags.map((tag) => `#${tag}`).join(" "));
    }

    return extractHashtags(values.join(" "));
};

export const splitTextByHashtags = (value = "") =>
    String(value).split(/(#[A-Za-z0-9_]+)/g);
