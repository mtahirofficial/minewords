import React, { useEffect, useMemo, useState } from "react";
import { showToast } from "../toast";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";
import BlogEditorForm from "../components/BlogEditorForm";

const EditBlogPage = () => {
    const navigate = useNavigate();
    const { slug } = useParams();
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState({
        title: "",
        excerpt: "",
        content: "",
        author: "",
        category: ""
    });

    useEffect(() => {
        const loadBlog = async () => {
            try {
                setLoading(true);
                const blogRes = await api.get(`/blogs/${slug}`);
                const blog = blogRes.data.blog;
                setInitialData({
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

        if (slug) {
            loadBlog();
        }
    }, [slug, navigate]);

    const memoInitialValues = useMemo(() => initialData, [initialData]);

    const handleUpdate = async (payload) => {
        try {
            const formData = new FormData();
            formData.append("title", payload.title || "");
            formData.append("excerpt", payload.excerpt || "");
            formData.append("content", payload.content || "");
            formData.append("author", payload.author || "");
            formData.append("category", payload.category || "");

            if (payload.coverImage) {
                formData.append("coverImage", payload.coverImage);
            }

            await api.put(`/blogs/${slug}`, formData);
            showToast("Blog updated successfully!");
            navigate(`/blog/${slug}`);
        } catch (err) {
            console.error("Blog update failed:", err.response?.data || err.message);
            showToast("Blog update failed!", "error");
            throw err;
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>
            </div>
        );
    }

    return (
        <BlogEditorForm
            pageTitle="Edit Article"
            pageSubtitle="Update and refine your post with the same professional editor."
            submitLabel="Update Blog"
            initialValues={memoInitialValues}
            onSubmit={handleUpdate}
            onCancel={() => navigate(-1)}
        />
    );
};

export default EditBlogPage;
