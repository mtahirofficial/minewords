import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { showToast } from "../toast";
import Modal from "../components/Modal";
import { useHandleCheckLogin } from "../helper";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const handleCheckLogin = useHandleCheckLogin();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    posts: 0,
    drafts: 0,
    comments: 0,
    views: 0,
  });

  const [recentPosts, setRecentPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [trending, setTrending] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const userRes = await api.get("/auth/me");
        const currentUser = userRes.data.data;
        if (
          typeof currentUser?.isVerified === "boolean" &&
          currentUser.isVerified !== user?.isVerified
        ) {
          updateUser({ isVerified: currentUser.isVerified });
        }

        const blogsRes = await api.get("/blogs?page=1&limit=1000");
        const allBlogs = blogsRes.data?.blogs || [];
        const userBlogs = allBlogs.filter((blog) => blog.userId === currentUser.id);

        const postsCount = userBlogs.length;
        const draftsCount = 0;
        const totalLikes = userBlogs.reduce((sum, blog) => sum + (blog.likesCount || 0), 0);
        const totalComments = userBlogs.reduce((sum, blog) => sum + (blog.Comments?.length || 0), 0);

        setStats({
          posts: postsCount,
          drafts: draftsCount,
          comments: totalComments,
          views: totalLikes,
        });

        const sortedPosts = [...userBlogs]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setRecentPosts(
          sortedPosts.map((blog) => ({
            id: blog.id,
            slug: blog.slug || String(blog.id),
            title: blog.title,
            date: new Date(blog.createdAt).toLocaleDateString(),
            status: "Published",
          })),
        );

        const uniqueCategories = [...new Set(userBlogs.map((b) => b.category).filter(Boolean))];
        setCategories(uniqueCategories);

        const allComments = [];
        userBlogs.forEach((blog) => {
          if (blog.Comments && blog.Comments.length > 0) {
            blog.Comments.forEach((comment) => {
              allComments.push({
                id: comment.id,
                user: comment.User?.name || "Anonymous",
                text: comment.content,
                post: blog.title,
                date: comment.createdAt,
              });
            });
          }
        });

        const sortedComments = allComments
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);
        setComments(sortedComments);

        const sortedByLikes = [...allBlogs]
          .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
          .slice(0, 3);

        setTrending(
          sortedByLikes.map((blog) => ({
            title: blog.title,
            views: blog.likesCount || 0,
          })),
        );
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        showToast("Failed to load dashboard data", "error");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const handleDeleteClick = (blogSlug) => {
    const blog = recentPosts.find((p) => p.slug === blogSlug);
    setBlogToDelete({ slug: blogSlug, title: blog?.title || "this blog post" });
    setDeleteModalOpen(true);
  };

  const handleDeleteBlog = async () => {
    if (!blogToDelete) return;

    try {
      await api.delete(`/blogs/${blogToDelete.slug}`);
      showToast("Blog deleted successfully", "success");

      const blogsRes = await api.get("/blogs?page=1&limit=1000");
      const allBlogs = blogsRes.data?.blogs || [];
      const userRes = await api.get("/auth/me");
      const currentUser = userRes.data.data;
      const userBlogs = allBlogs.filter((blog) => blog.userId === currentUser.id);

      const sortedPosts = [...userBlogs]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setRecentPosts(
        sortedPosts.map((blog) => ({
          id: blog.id,
          slug: blog.slug || String(blog.id),
          title: blog.title,
          date: new Date(blog.createdAt).toLocaleDateString(),
          status: "Published",
        })),
      );

      setStats((prev) => ({ ...prev, posts: userBlogs.length }));
      setDeleteModalOpen(false);
      setBlogToDelete(null);
    } catch (err) {
      console.error("Error deleting blog:", err);
      showToast("Failed to delete blog", "error");
      setDeleteModalOpen(false);
      setBlogToDelete(null);
    }
  };

  const handleResendVerification = async () => {
    if (isResendingVerification) return;

    try {
      setIsResendingVerification(true);
      await api.post("/auth/resend-verification");
      showToast("Verification email sent. Please check your inbox.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to resend verification email", "error");
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <main className="container">
      <section className="dashboard-welcome">
        <h1>Welcome back, {user?.name || "User"}</h1>
        <p className="welcome-tagline">
          Here is a quick overview of your blog activity and performance.
        </p>
        <p className="welcome-description">
          Track your post performance, manage drafts, view recent comments, and stay updated
          with what is trending on your blog.
        </p>
      </section>

      {!user?.isVerified && (
        <section className="verify-banner">
          <div>
            <h3>Verify your email to unlock posting and interactions</h3>
            <p>
              You can login and browse, but creating posts, likes, and comments need email verification.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleResendVerification}
            disabled={isResendingVerification}
          >
            {isResendingVerification ? "Sending..." : "Resend verification link"}
          </button>
        </section>
      )}

      <div className="dashboard-stats">
        {Object.entries(stats).map(([key, value]) => (
          <div className="stat-card" key={key}>
            <h3>{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
            <p>{value}</p>
          </div>
        ))}
      </div>

      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="qa-buttons">
          <button
            className="btn btn-primary"
            onClick={() => {
              const canProceed = handleCheckLogin({ requireVerified: true });
              if (!canProceed) return;
              navigate("/create");
            }}
          >
            Create New Post
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              navigate("/categories");
            }}
          >
            Browse Categories
          </button>
        </div>
      </section>

      <section className="recent-posts">
        <h2>Recent Posts</h2>
        <table className="posts-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                  Loading...
                </td>
              </tr>
            ) : recentPosts.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                  No posts yet. Create your first post.
                </td>
              </tr>
            ) : (
              recentPosts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>{post.date}</td>
                  <td>{post.status}</td>
                  <td className="post-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/blog/${post.slug}/edit`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-critical"
                      onClick={() => handleDeleteClick(post.slug)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <div className="dashboard-grid">
        <div className="dash-box">
          <h3>Your Categories</h3>
          <ul className="list-box">
            {categories.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="dash-box">
          <h3>Latest Comments</h3>
          <ul className="list-box">
            {comments.map((c, i) => (
              <li key={i}>
                <strong>{c.user}:</strong> {c.text}
                <span className="small-label">({c.post})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="dash-box">
          <h3>Trending Articles</h3>
          <ul className="list-box">
            {trending.map((t, i) => (
              <li key={i}>
                {t.title}
                <span className="small-label">{t.views} views</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setBlogToDelete(null);
        }}
        header="Delete Blog Post"
        primaryAction={{
          label: "Delete",
          onClick: handleDeleteBlog,
          closeOnClick: false,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => {
            setDeleteModalOpen(false);
            setBlogToDelete(null);
          },
        }}
        primaryActionType="critical"
        showCloseButton={true}
        closeOnOverlayClick={true}
      >
        <p>
          Are you sure you want to delete <strong>"{blogToDelete?.title}"</strong>?
        </p>
        <p>
          This action cannot be undone and all associated comments and likes will be permanently removed.
        </p>
      </Modal>
    </main>
  );
};

export default DashboardPage;
