import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import BlogCard from "../../src/components/BlogCard";
import api from "../../src/api";

const HashtagPage = () => {
  const router = useRouter();
  const rawTag = Array.isArray(router.query.tag)
    ? router.query.tag[0]
    : router.query.tag;
  const tag = rawTag || "";
  const routeReady = router.isReady && Boolean(tag);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;

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

      {!routeReady || loading ? (
        <div className="single-blog-loading">Loading posts...</div>
      ) : blogs.length === 0 ? (
        <div className="single-blog-not-found">
          <h2>No posts found for #{tag.toLowerCase()}</h2>
          <Link className="btn btn-secondary" href="/">
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
