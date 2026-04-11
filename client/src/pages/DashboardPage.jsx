import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { showToast } from "../toast";
import Modal from "../components/Modal";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch user info to get user ID
        const userRes = await api.get("/auth/me");
        const currentUser = userRes.data.data;

        // Fetch all blogs and filter by user
        const blogsRes = await api.get("/blogs?page=1&limit=1000");
        const allBlogs = blogsRes.data?.blogs || [];
        const userBlogs = allBlogs.filter(blog => blog.userId === currentUser.id);

        // Calculate stats
        const postsCount = userBlogs.length;
        const draftsCount = 0; // No draft status yet
        const totalLikes = userBlogs.reduce((sum, blog) => sum + (blog.likesCount || 0), 0);
        const totalComments = userBlogs.reduce((sum, blog) => sum + (blog.Comments?.length || 0), 0);

        setStats({
          posts: postsCount,
          drafts: draftsCount,
          comments: totalComments,
          views: totalLikes, // Using likes as proxy for views
        });

        // Get recent posts (last 5)
        const sortedPosts = [...userBlogs].sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 5);
        setRecentPosts(sortedPosts.map(blog => ({
          id: blog.id,
          slug: blog.slug || String(blog.id),
          title: blog.title,
          date: new Date(blog.createdAt).toLocaleDateString(),
          status: "Published"
        })));

        // Get unique categories from user's blogs
        const uniqueCategories = [...new Set(userBlogs.map(b => b.category).filter(Boolean))];
        setCategories(uniqueCategories);

        // Get comments on user's blogs
        const allComments = [];
        userBlogs.forEach(blog => {
          if (blog.Comments && blog.Comments.length > 0) {
            blog.Comments.forEach(comment => {
              allComments.push({
                id: comment.id,
                user: comment.User?.name || "Anonymous",
                text: comment.content,
                post: blog.title,
                date: comment.createdAt
              });
            });
          }
        });
        const sortedComments = allComments.sort((a, b) =>
          new Date(b.date) - new Date(a.date)
        ).slice(0, 5);
        setComments(sortedComments);

        // Get trending (most liked blogs)
        const sortedByLikes = [...allBlogs].sort((a, b) =>
          (b.likesCount || 0) - (a.likesCount || 0)
        ).slice(0, 3);
        setTrending(sortedByLikes.map(blog => ({
          title: blog.title,
          views: blog.likesCount || 0
        })));

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        showToast("Failed to load dashboard data", "error");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleDeleteClick = (blogSlug) => {
    const blog = recentPosts.find(p => p.slug === blogSlug);
    setBlogToDelete({ slug: blogSlug, title: blog?.title || "this blog post" });
    setDeleteModalOpen(true);
  };

  const handleDeleteBlog = async () => {
    if (!blogToDelete) return;

    try {
      await api.delete(`/blogs/${blogToDelete.slug}`);
      showToast("Blog deleted successfully", "success");

      // Refresh the page data
      const blogsRes = await api.get("/blogs?page=1&limit=1000");
      const allBlogs = blogsRes.data?.blogs || [];
      const userRes = await api.get("/auth/me");
      const currentUser = userRes.data.data;
      const userBlogs = allBlogs.filter(blog => blog.userId === currentUser.id);

      const sortedPosts = [...userBlogs].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 5);
      setRecentPosts(sortedPosts.map(blog => ({
        id: blog.id,
        slug: blog.slug || String(blog.id),
        title: blog.title,
        date: new Date(blog.createdAt).toLocaleDateString(),
        status: "Published"
      })));

      setStats(prev => ({ ...prev, posts: userBlogs.length }));

      // Close modal and reset
      setDeleteModalOpen(false);
      setBlogToDelete(null);
    } catch (err) {
      console.error("Error deleting blog:", err);
      showToast("Failed to delete blog", "error");
      setDeleteModalOpen(false);
      setBlogToDelete(null);
    }
  };

  return (
    <main className="container">

      {/* ---------------- WELCOME SECTION ---------------- */}
      <section className="dashboard-welcome">
        <h1>Welcome back, {user?.name || "User"} 👋</h1>
        <p className="welcome-tagline">
          Here's a quick overview of your blog activity and performance.
        </p>
        <p className="welcome-description">
          Track your post performance, manage drafts, view recent comments, and stay updated
          with what’s trending on your blog. Your content is growing every day — keep up the great work!
        </p>
      </section>

      {/* ---------------- STATS START ---------------- */}
      <div className="dashboard-stats">
        {Object.entries(stats).map(([key, value]) => (
          <div className="stat-card" key={key}>
            <h3>{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
            <p>{value}</p>
          </div>
        ))}
      </div>

      {/* ---------------- QUICK ACTIONS ---------------- */}
      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="qa-buttons">
          <button className="btn btn-primary" onClick={() => {
            navigate("/create")
          }}>Create New Post</button>
          <button className="btn btn-secondary" onClick={() => {
            navigate("/categories")
          }}>Browse Categories</button>
        </div>
      </section>

      {/* ---------------- RECENT POSTS ---------------- */}
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
                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>Loading...</td>
              </tr>
            ) : recentPosts.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No posts yet. Create your first post!</td>
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
                    >Edit</button>
                    <button
                      className="btn btn-critical"
                      onClick={() => handleDeleteClick(post.slug)}
                    >Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* ---------------- 3 BOX GRID ---------------- */}
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

      {/* Delete Confirmation Modal */}
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
          closeOnClick: false
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => {
            setDeleteModalOpen(false);
            setBlogToDelete(null);
          }
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
