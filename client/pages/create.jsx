import ProtectedRoute from "../src/components/ProtectedRoute";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../src/context/AuthContext";
import api from "../src/api";
import { showToast } from "../src/toast";
import BlogEditorForm from "../src/components/BlogEditorForm";
import { useHandleCheckLogin } from "../src/helper";

const BlogForm = () => {
    const router = useRouter();
    const slug = Array.isArray(router.query.slug) ? router.query.slug[0] : router.query.slug;
    const { user } = useAuth();
    const handleCheckLogin = useHandleCheckLogin();
    const isEdit = router.pathname === "/blog/[slug]/edit";
    const draftStorageKey = !isEdit && user?.id ? `create:${user.id}` : "";
    const draftServerKey = !isEdit && user?.id ? `minewords:blogDraftServer:create:${user.id}` : "";
    const [draftServerSlug, setDraftServerSlug] = useState("");

    const [loading, setLoading] = useState(isEdit);
    const [initialValues, setInitialValues] = useState({
        title: "",
        excerpt: "",
        content: "",
        author: user?.name || "",
        category: "",
        tags: []
    });

    useEffect(() => {
        if (!isEdit) {
            setInitialValues((prev) => ({ ...prev, author: user?.name || prev.author || "" }));
            setLoading(false);
            return;
        }

        if (!slug) {
            setLoading(true);
            return;
        }

        const loadBlog = async () => {
            try {
                setLoading(true);
                const blogRes = await api.get(`/blogs/${slug}`);
                const blog = blogRes.data.blog;
                setInitialValues({
                    title: blog.title || "",
                    excerpt: blog.excerpt || "",
                    content: blog.content || "",
                    author: blog.author || blog?.User?.name || "",
                    category: blog.category || "",
                    tags: Array.isArray(blog.tags)
                        ? blog.tags
                        : (typeof blog.tags === "string" ? blog.tags.split(",") : [])
                });
            } catch (err) {
                console.error("Error loading blog:", err);
                showToast("Failed to load blog", "error");
                router.push("/dashboard");
            } finally {
                setLoading(false);
            }
        };

        loadBlog();
    }, [slug, isEdit, router, user, user?.name]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!draftServerKey) return;
        const existing = window.localStorage.getItem(draftServerKey) || "";
        if (existing) setDraftServerSlug(existing);
    }, [draftServerKey]);

    const persistDraftServerSlug = (next) => {
        const value = String(next || "");
        setDraftServerSlug(value);
        if (typeof window === "undefined") return;
        if (!draftServerKey) return;
        if (!value) {
            window.localStorage.removeItem(draftServerKey);
            return;
        }
        window.localStorage.setItem(draftServerKey, value);
    };

    const handleSubmit = async (payload) => {
        const formData = new FormData();
        formData.append("title", payload.title || "");
        formData.append("excerpt", payload.excerpt || "");
        formData.append("content", payload.content || "");
        formData.append("author", payload.author || "");
        formData.append("category", payload.category || "");
        formData.append("tags", JSON.stringify(payload.tags || []));
        formData.append("status", "published");

        if (payload.coverImage) {
            formData.append("coverImage", payload.coverImage);
        }

        if (isEdit) {
            try {
                await api.put(`/blogs/${slug}`, formData);
                showToast("Blog updated successfully!");
                router.push(`/blog/${slug}`);
            } catch (err) {
                console.error("Blog update failed:", err.response?.data || err.message);
                showToast("Blog update failed!", "error");
                throw err;
            }
            return;
        }

        const canProceed = handleCheckLogin({ requireVerified: true });
        if (!canProceed) {
            throw new Error("Email verification required");
        }

        try {
            let res;
            const normalizedDraftId = String(draftServerSlug || "").trim();

            if (normalizedDraftId) {
                try {
                    res = await api.put(`/blogs/${normalizedDraftId}`, formData);
                } catch (error) {
                    const status = error?.response?.status;
                    if (status === 404) {
                        persistDraftServerSlug("");
                        res = await api.post("/blogs", formData);
                    } else {
                        throw error;
                    }
                }
            } else {
                res = await api.post("/blogs", formData);
            }
            showToast("Blog submitted successfully!");
            persistDraftServerSlug("");
            router.push(`/blog/${res.data?.blog?.slug || res.data?.data?.slug || res.data?.blog?.id || res.data?.data?.id}`);
        } catch (err) {
            console.error("Blog creation failed:", err.response?.data || err.message);
            showToast("Blog creation failed!", "error");
            throw err;
        }
    };

    const handleSaveDraft = async (payload) => {
        if (!user?.id) {
            throw new Error("Login required");
        }

        const formData = new FormData();
        formData.append("title", payload.title || "");
        formData.append("excerpt", payload.excerpt || "");
        formData.append("content", payload.content || "");
        formData.append("author", payload.author || "");
        formData.append("category", payload.category || "");
        formData.append("tags", JSON.stringify(payload.tags || []));
        formData.append("status", "draft");

        if (payload.coverImage) {
            formData.append("coverImage", payload.coverImage);
        }

        let res;
        const normalizedDraftId = String(draftServerSlug || "").trim();

        if (normalizedDraftId) {
            try {
                res = await api.put(`/blogs/${normalizedDraftId}`, formData);
            } catch (error) {
                const status = error?.response?.status;
                if (status === 404) {
                    // Stale local draft pointer (draft deleted server-side). Create a new one.
                    persistDraftServerSlug("");
                    res = await api.post("/blogs", formData);
                } else {
                    throw error;
                }
            }
        } else {
            res = await api.post("/blogs", formData);
        }

        const nextSlug = res.data?.blog?.slug || res.data?.data?.slug || res.data?.blog?.id || res.data?.data?.id || "";
        if (nextSlug) {
            persistDraftServerSlug(nextSlug);
        }
    };

    const memoInitialValues = useMemo(() => initialValues, [initialValues]);

    if (loading) {
        return (
            <div className="container">
                <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>
            </div>
        );
    }

    return (
        <BlogEditorForm
            pageTitle={isEdit ? "Edit Article" : "Create a New Article"}
            pageSubtitle={isEdit ? "Update and refine your post with the same professional editor." : "Write, format, and publish a polished post with complete metadata."}
            submitLabel={isEdit ? "Update Blog" : "Publish Blog"}
            initialValues={memoInitialValues}
            onSubmit={handleSubmit}
            onSaveDraft={isEdit ? undefined : handleSaveDraft}
            draftStorageKey={draftStorageKey}
            onCancel={() => router.back()}
        />
    );
};

export default function CreateBlogRoute() {
  return (
    <ProtectedRoute>
      <BlogForm />
    </ProtectedRoute>
  );
}
