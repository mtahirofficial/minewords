import React, { useState, useEffect, useMemo } from "react";
import { Calendar, User, MessageCircle, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  extractBlogHashtags,
  splitTextByHashtags,
  useHandleCheckLogin,
} from "../helper";
import api from "../api";
import { showToast } from "../toast";
import { resolveStaticFileUrl } from "../utils/staticUrl";

const resolveBlogImageUrl = (value = "") => {
  return resolveStaticFileUrl(value, process.env.VITE_API_URL || api.defaults.baseURL);
};

const BlogCard = ({ post, onUpdate }) => {
  const handleCheckLogin = useHandleCheckLogin();
  const router = useRouter();
  const blogPath = `/blog/${encodeURIComponent(post.slug || post.id)}`;
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [imageFailed, setImageFailed] = useState(false);

  const coverImageUrl = resolveBlogImageUrl(post?.coverImage);
  const postTags = useMemo(() => extractBlogHashtags(post), [post]);

  useEffect(() => {
    setLikesCount(post.likesCount || 0);
    setIsLiked(post.isLiked || false);
  }, [post.likesCount, post.isLiked]);

  useEffect(() => {
    setImageFailed(false);
  }, [post?.coverImage, post?.id]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isLogged = handleCheckLogin({ requireVerified: true });
    if (!isLogged) return;

    try {
      const res = await api.post(`/likes/${post.id}/toggle`);
      setIsLiked(res.data.liked);
      setLikesCount(res.data.likesCount);

      if (onUpdate) {
        onUpdate(post.id, { likesCount: res.data.likesCount });
      }

      showToast(res.data.liked ? "Liked!" : "Unliked", "success");
    } catch (err) {
      console.error("Like toggle failed:", err);
      showToast("Failed to update like", "error");
    }
  };

  const handleComment = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isLogged = handleCheckLogin({ requireVerified: true });
    if (!isLogged) return;

    router.push(`${blogPath}#comment`);
  };

  const handleHashtagClick = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/hashtag/${tag.toLowerCase()}`);
  };

  const renderWithHashtags = (value = "", keyPrefix = "text") =>
    splitTextByHashtags(value).map((part, index) => {
      if (!/^#[A-Za-z0-9_]+$/.test(part)) {
        return (
          <React.Fragment key={`${keyPrefix}-${index}`}>{part}</React.Fragment>
        );
      }

      const clean = part.slice(1).toLowerCase();
      return (
        <button
          key={`${keyPrefix}-${index}`}
          type="button"
          className="hashtag-inline-btn"
          onClick={(event) => handleHashtagClick(event, clean)}
        >
          {part}
        </button>
      );
    });

  return (
    <Link href={blogPath}>
      <article className="blog-card">
        {!imageFailed && coverImageUrl && (
          <figure className="blog-card-cover-wrap">
            <img
              src={coverImageUrl}
              alt={post?.title || "Blog cover image"}
              className="blog-card-cover-image"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          </figure>
        )}

        <div className="post-meta">
          <Calendar /> {new Date(post.createdAt).toISOString().split("T")[0]} |{" "}
          {post.readTime}
        </div>

        <h3>{renderWithHashtags(post.title || "", `title-${post.id}`)}</h3>

        <p>{renderWithHashtags(post.excerpt || "", `excerpt-${post.id}`)}</p>
        {postTags.length > 0 && (
          <div className="post-tag-list">
            {postTags.slice(0, 8).map((tag) => (
              <button
                key={`${post.id}-tag-${tag}`}
                type="button"
                className="post-tag-chip"
                onClick={(event) => handleHashtagClick(event, tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="post-footer">
          <div className="author">
            Author:{" "}
            <span className="author-badge">
              {post.author !== "" ? post?.author : post?.User?.name}
            </span>
          </div>
          <div className="post-info-row">
            <div className="post-info-user">
              <User className="post-info-user-icon" />
              <span className="post-info-user-name">{post?.User?.name}</span>
            </div>

            <div className="actions">
              <button
                className={`like-btn ${isLiked ? "liked" : ""}`}
                onClick={handleLike}
              >
                <Heart fill={isLiked ? "currentColor" : "none"} /> {likesCount}
              </button>

              <button className="comment-btn" onClick={handleComment}>
                <MessageCircle /> {post.Comments?.length || 0}
              </button>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;

