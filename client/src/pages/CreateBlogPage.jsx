import React, { useMemo } from "react";
import { showToast } from "../toast";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BlogEditorForm from "../components/BlogEditorForm";

const CreateBlogPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const initialValues = useMemo(() => ({
        title: "",
        excerpt: "",
        content: "",
        author: user?.name || "",
        category: ""
    }), [user?.name]);

    const handleCreate = async (payload) => {
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

            const res = await api.post("/blogs", formData);
            showToast("Blog submitted successfully!");
            navigate(`/blog/${res.data?.blog?.slug || res.data?.blog?.id}`);
        } catch (err) {
            console.error("Blog creation failed:", err.response?.data || err.message);
            showToast("Blog creation failed!", "error");
            throw err;
        }
    };

    return (
        <BlogEditorForm
            pageTitle="Create a New Article"
            pageSubtitle="Write, format, and publish a polished post with complete metadata."
            submitLabel="Publish Blog"
            initialValues={initialValues}
            onSubmit={handleCreate}
            onCancel={() => navigate(-1)}
        />
    );
};

export default CreateBlogPage;
