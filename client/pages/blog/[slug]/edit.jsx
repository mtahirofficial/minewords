import ProtectedRoute from "../../../src/components/ProtectedRoute";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../../src/context/AuthContext";
import api from "../../../src/api";
import { showToast } from "../../../src/toast";
import BlogEditorForm from "../../../src/components/BlogEditorForm";
import { useHandleCheckLogin } from "../../../src/helper";

const BlogForm = () => {
    const router = useRouter();
    const slug = Array.isArray(router.query.slug) ? router.query.slug[0] : router.query.slug;
    const { user } = useAuth();
    const handleCheckLogin = useHandleCheckLogin();
    const isEdit = router.pathname === "/blog/[slug]/edit";

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
        if (!isEdit && user && !user.isVerified) {
            const canProceed = handleCheckLogin({ requireVerified: true });
            if (!canProceed) {
                router.push("/dashboard");
                return;
            }
        }

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

    const handleSubmit = async (payload) => {
        const formData = new FormData();
        formData.append("title", payload.title || "");
        formData.append("excerpt", payload.excerpt || "");
        formData.append("content", payload.content || "");
        formData.append("author", payload.author || "");
        formData.append("category", payload.category || "");
        formData.append("tags", JSON.stringify(payload.tags || []));

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
            const res = await api.post("/blogs", formData);
            showToast("Blog submitted successfully!");
            router.push(`/blog/${res.data?.blog?.slug || res.data?.blog?.id}`);
        } catch (err) {
            console.error("Blog creation failed:", err.response?.data || err.message);
            showToast("Blog creation failed!", "error");
            throw err;
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
            onCancel={() => router.back()}
        />
    );
};

export default function EditBlogRoute() {
  return (
    <ProtectedRoute>
      <BlogForm />
    </ProtectedRoute>
  );
}
