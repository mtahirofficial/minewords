import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { showToast } from "../toast";
import BlogEditorForm from "../components/BlogEditorForm";

const BlogForm = () => {
    const navigate = useNavigate();
    const { slug } = useParams();
    const { user } = useAuth();
    const isEdit = Boolean(slug);

    const [loading, setLoading] = useState(isEdit);
    const [initialValues, setInitialValues] = useState({
        title: "",
        excerpt: "",
        content: "",
        author: user?.name || "",
        category: ""
    });

    useEffect(() => {
        if (!isEdit) {
            setInitialValues((prev) => ({ ...prev, author: user?.name || prev.author || "" }));
            setLoading(false);
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
                    category: blog.category || ""
                });
            } catch (err) {
                console.error("Error loading blog:", err);
                showToast("Failed to load blog", "error");
                navigate("/dashboard");
            } finally {
                setLoading(false);
            }
        };

        loadBlog();
    }, [slug, isEdit, navigate, user?.name]);

    const handleSubmit = async (payload) => {
        const formData = new FormData();
        formData.append("title", payload.title || "");
        formData.append("excerpt", payload.excerpt || "");
        formData.append("content", payload.content || "");
        formData.append("author", payload.author || "");
        formData.append("category", payload.category || "");

        if (payload.coverImage) {
            formData.append("coverImage", payload.coverImage);
        }

        if (isEdit) {
            try {
                await api.put(`/blogs/${slug}`, formData);
                showToast("Blog updated successfully!");
                navigate(`/blog/${slug}`);
            } catch (err) {
                console.error("Blog update failed:", err.response?.data || err.message);
                showToast("Blog update failed!", "error");
                throw err;
            }
            return;
        }

        try {
            const res = await api.post("/blogs", formData);
            showToast("Blog submitted successfully!");
            navigate(`/blog/${res.data?.blog?.slug || res.data?.blog?.id}`);
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
            onCancel={() => navigate(-1)}
        />
    );
};

export default BlogForm;
