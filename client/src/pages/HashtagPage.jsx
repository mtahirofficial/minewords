import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BlogCard from "../components/BlogCard";
import api from "../api";

const HashtagPage = () => {
  const { tag = "" } = useParams();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/hashtags/${encodeURIComponent(tag)}/blogs`);
        setBlogs(res.data?.blogs || []);
      } catch (error) {
        console.error("Failed to load hashtag blogs", error);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tag]);

  return (
    <main className="container hashtag-page">
      <div className="hashtag-page-head">
        <p>Hashtag Feed</p>
        <h1>#{tag.toLowerCase()}</h1>
      </div>

      {loading ? (
        <div className="single-blog-loading">Loading posts...</div>
      ) : blogs.length === 0 ? (
        <div className="single-blog-not-found">
          <h2>No posts found for #{tag.toLowerCase()}</h2>
          <Link className="btn btn-secondary" to="/">
            Browse all posts
          </Link>
        </div>
      ) : (
        <div className="blog-list">
          {blogs.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
};

export default HashtagPage;
