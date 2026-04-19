import { useRouter } from "next/router";
import Head from "next/head";
import {
  Heart,
  MessageCircle,
  Share2,
  User,
  Calendar,
  Clock,
  BookOpen,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  extractBlogHashtags,
  fetchHashtagSuggestions,
  useHandleCheckLogin,
  withFreeHashtagSuggestion,
} from "../../../src/helper";
import api from "../../../src/api";
import { showToast } from "../../../src/toast";
import AdBanner from "../../../src/components/AdBanner";
import BlogPostSchema from "../../../src/components/BlogPostSchema";
import { getServerApiBaseUrl, getSiteOrigin } from "../../../src/config/runtime";
import { resolveStaticFileUrl } from "../../../src/utils/staticUrl";

const BLOGS_PAGE_LIMIT = 1000;
const API_BASE = getServerApiBaseUrl();
const SITE_ORIGIN = getSiteOrigin();

const toAbsoluteUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${SITE_ORIGIN}${path}`;
};

const containsHtmlTag = (value = "") => /<\/?[a-z][\s\S]*>/i.test(value);

const sanitizeHtml = (unsafeHtml = "") => {
  if (typeof window === "undefined") return unsafeHtml;

  const parser = new DOMParser();
  const doc = parser.parseFromString(unsafeHtml, "text/html");

  doc
    .querySelectorAll("script, style, iframe, object, embed")
    .forEach((node) => node.remove());

  doc.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value || "";
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        return;
      }
      if (
        (name === "href" || name === "src") &&
        value.trim().toLowerCase().startsWith("javascript:")
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
};

const linkifyHashtagsInHtml = (safeHtml = "") => {
  if (typeof window === "undefined") return safeHtml;

  const parser = new DOMParser();
  const doc = parser.parseFromString(safeHtml, "text/html");

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((textNode) => {
    const value = textNode.nodeValue || "";
    if (!/#([A-Za-z0-9_]+)/.test(value) && !/(https?:\/\/[^\s<]+)/i.test(value)) {
      return;
    }
    if (!textNode.parentElement || textNode.parentElement.closest("a")) return;

    const parts = value.split(/(https?:\/\/[^\s<]+|#[A-Za-z0-9_]+)/g);
    if (!parts.length) return;

    const fragment = doc.createDocumentFragment();
    parts.forEach((part) => {
      if (/^https?:\/\/[^\s<]+$/i.test(part)) {
        const url = doc.createElement("a");
        url.href = part;
        url.className = "mw-linkified-url";
        url.target = "_blank";
        url.rel = "noopener noreferrer";
        url.textContent = part;
        fragment.appendChild(url);
        return;
      }
      if (/^#[A-Za-z0-9_]+$/.test(part)) {
        const clean = part.slice(1).toLowerCase();
        const anchor = doc.createElement("a");
        anchor.href = `/hashtag/${encodeURIComponent(clean)}`;
        anchor.className = "mw-hashtag-link";
        anchor.textContent = part;
        fragment.appendChild(anchor);
        return;
      }
      fragment.appendChild(doc.createTextNode(part));
    });

    textNode.parentNode?.replaceChild(fragment, textNode);
  });

  return doc.body.innerHTML;
};

const resolveBlogImageUrl = (value = "") => {
  return resolveStaticFileUrl(value, process.env.VITE_API_URL || api.defaults.baseURL);
};

const formatStableDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

async function fetchPostBySlug(slug) {
  const response = await fetch(`${API_BASE}/blogs/${encodeURIComponent(slug)}`);
  if (!response.ok) return null;

  const payload = await response.json();
  return payload?.blog || null;
}

async function fetchAllPosts() {
  const response = await fetch(`${API_BASE}/blogs?page=1&limit=${BLOGS_PAGE_LIMIT}`);
  if (!response.ok) return [];

  const payload = await response.json();
  return payload?.blogs || [];
}

export async function getStaticProps({ params }) {
  const slug = params?.slug;
  if (!slug) {
    return {
      notFound: true,
      revalidate: 60,
    };
  }

  const post = await fetchPostBySlug(slug);
  if (!post) {
    return {
      notFound: true,
      revalidate: 60,
    };
  }

  return {
    props: {
      initialBlog: post,
      slug,
    },
    revalidate: 60,
  };
}

export async function getStaticPaths() {
  try {
    const posts = await fetchAllPosts();
    const paths = posts
      .map((post) => post?.slug)
      .filter(Boolean)
      .map((slug) => ({ params: { slug } }));

    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("Failed to build static blog paths", error);
    return { paths: [], fallback: "blocking" };
  }
}

const SingleBlogPage = ({ initialBlog, slug: staticSlug }) => {
  const router = useRouter();
  const routeSlug = Array.isArray(router.query.slug)
    ? router.query.slug[0]
    : router.query.slug || staticSlug;
  const handleCheckLogin = useHandleCheckLogin();
  const [blog, setBlog] = useState(initialBlog || null);
  const [liked, setLiked] = useState(initialBlog?.isLiked || false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(!initialBlog);
  const [commentTagSuggestions, setCommentTagSuggestions] = useState([]);
  const [showCommentTagSuggestions, setShowCommentTagSuggestions] =
    useState(false);
  const [commentTagQuery, setCommentTagQuery] = useState("");
  const commentTagDebounceRef = useRef(null);
  const blogInlineSlot = process.env.VITE_ADSENSE_SLOT_BLOG_INLINE?.trim();
  const blogFooterSlot = process.env.VITE_ADSENSE_SLOT_BLOG_FOOTER?.trim();

  const textareaRef = useRef(null);
  const blogContent = blog?.content || "";
  const hasHtmlContent = containsHtmlTag(blogContent);
  const sanitizedContent = useMemo(() => {
    if (!hasHtmlContent) return "";
    return sanitizeHtml(blogContent);
  }, [hasHtmlContent, blogContent]);
  const linkifiedHtmlContent = useMemo(() => {
    if (!sanitizedContent) return "";
    return linkifyHashtagsInHtml(sanitizedContent);
  }, [sanitizedContent]);
  const blogTags = useMemo(() => extractBlogHashtags(blog || {}), [blog]);
  const coverImageUrl = useMemo(() => resolveBlogImageUrl(blog?.coverImage), [blog?.coverImage]);

  const schemaPost = useMemo(() => {
    if (!blog) return null;

    const authorObject =
      blog.author && typeof blog.author === "object"
        ? blog.author
        : {
            name: blog.author || blog?.User?.name || "MineWords Team",
            slug: blog?.User?.slug || "",
          };

    return {
      ...blog,
      slug: blog.slug || routeSlug || staticSlug || "",
      author: authorObject,
      coverImage: coverImageUrl || blog.coverImage,
    };
  }, [blog, coverImageUrl, routeSlug, staticSlug]);

  const seoMeta = useMemo(() => {
    if (!blog) return null;

    const canonicalSlug = blog.slug || routeSlug || staticSlug || "";
    const canonicalUrl = `${SITE_ORIGIN}/blog/${canonicalSlug}`;
    const title = `${blog.title || "Blog"} - MineWords`;
    const description =
      blog.excerpt ||
      (blog.content
        ? String(blog.content).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
        : "Read this article on MineWords.");
    const image = toAbsoluteUrl(coverImageUrl) || `${SITE_ORIGIN}/og-cover.jpg`;
    const authorName =
      (blog.author && typeof blog.author === "object" && blog.author?.name) ||
      blog.author ||
      blog?.User?.name ||
      "MineWords Team";

    return {
      canonicalUrl,
      title,
      description,
      image,
      authorName,
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt || blog.createdAt,
      keywords: blogTags.length ? blogTags.map((tag) => `#${tag}`).join(", ") : "",
    };
  }, [blog, blogTags, coverImageUrl, routeSlug, staticSlug]);

  useEffect(() => {
    if (!routeSlug) return;

    const loadBlog = async () => {
      try {
        if (!initialBlog || initialBlog?.slug !== routeSlug) {
          setLoading(true);
        }
        const res = await api.get("/blogs/" + routeSlug);
        const blogData = res.data.blog;
        setBlog(blogData);
        setLiked(blogData.isLiked || false);
      } catch (err) {
        console.error("Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [routeSlug, initialBlog]);

  useEffect(() => {
    if (window.location.hash === "#comment" && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    }
  }, [blog, loading]);

  const handleLike = async () => {
    const isLogged = handleCheckLogin({ requireVerified: true });
    if (!isLogged) return;
    if (!blog?.id) return;

    try {
      const res = await api.post(`/likes/${blog.id}/toggle`);
      setLiked(res.data.liked);
      setBlog((prev) => ({ ...prev, likesCount: res.data.likesCount }));
      showToast(res.data.liked ? "Liked!" : "Unliked", "success");
    } catch (err) {
      console.error("Like toggle failed:", err);
      showToast("Failed to update like", "error");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!blog?.id) return;

    const isLogged = handleCheckLogin({ requireVerified: true });
    if (!isLogged) return;

    try {
      await api.post(`/comments/${blog.id}`, { content: comment });
      const blogRes = await api.get("/blogs/" + routeSlug);
      setBlog(blogRes.data.blog);
      setComment("");
      showToast("Comment posted successfully!", "success");
    } catch (err) {
      console.error("Comment failed:", err);
      showToast("Failed to post comment", "error");
    }
  };

  const handleComment = () => {
    const isLogged = handleCheckLogin({ requireVerified: true });
    if (!isLogged) return;
    textareaRef.current?.focus();
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!", "success");
    } catch (err) {
      console.error("Failed to copy URL:", err);
      showToast("Failed to copy link", "error");
    }
  };

  const handleHashtagClick = (tag) => {
    router.push(`/hashtag/${tag.toLowerCase()}`);
  };

  const hideCommentSuggestions = (delay = 0) => {
    const close = () => {
      setShowCommentTagSuggestions(false);
      setCommentTagSuggestions([]);
      setCommentTagQuery("");
    };
    if (!delay) {
      close();
      return;
    }
    setTimeout(close, delay);
  };

  const detectCommentHashtag = (value = "", cursor = 0) => {
    const textBeforeCursor = String(value).slice(0, Math.max(0, Number(cursor || 0)));
    const match = textBeforeCursor.match(/(?:^|\s)#([A-Za-z0-9_]*)$/);
    if (!match) {
      hideCommentSuggestions();
      return;
    }

    const query = match[1] || "";
    setCommentTagQuery(query);
    setShowCommentTagSuggestions(true);

    if (commentTagDebounceRef.current) {
      clearTimeout(commentTagDebounceRef.current);
    }

    commentTagDebounceRef.current = setTimeout(async () => {
      try {
        const items = await fetchHashtagSuggestions(query);
        setCommentTagSuggestions(withFreeHashtagSuggestion(items, query));
      } catch (error) {
        console.error("Failed to fetch comment hashtag suggestions", error);
        setCommentTagSuggestions([]);
      }
    }, 180);
  };

  const handleCommentChange = (e) => {
    const { value, selectionStart } = e.target;
    setComment(value);
    detectCommentHashtag(value, selectionStart);
  };

  const selectCommentHashtag = (tagName = "") => {
    const input = textareaRef.current;
    if (!input) return;

    const cursor = input.selectionStart || 0;
    const textBeforeCursor = comment.slice(0, cursor);
    const match = textBeforeCursor.match(/(?:^|\s)#([A-Za-z0-9_]*)$/);
    if (!match) return;

    const matchedText = match[0];
    const startsWithSpace = matchedText.startsWith(" ");
    const replaceStart = cursor - matchedText.length + (startsWithSpace ? 1 : 0);
    const nextValue = comment.slice(0, replaceStart) + `#${tagName} ` + comment.slice(cursor);
    const nextCursor = replaceStart + tagName.length + 2;

    setComment(nextValue);
    hideCommentSuggestions();

    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  useEffect(
    () => () => {
      if (commentTagDebounceRef.current) {
        clearTimeout(commentTagDebounceRef.current);
      }
    },
    [],
  );

  const renderLineWithHashtags = (line = "", keyPrefix = "line") =>
    String(line)
      .split(/(https?:\/\/[^\s<]+|#[A-Za-z0-9_]+)/g)
      .map((part, i) => {
        if (/^https?:\/\/[^\s<]+$/i.test(part)) {
          return (
            <a
              key={`${keyPrefix}-${i}`}
              className="mw-linkified-url"
              href={part}
              target="_blank"
              rel="noopener noreferrer"
            >
              {part}
            </a>
          );
        }
        if (!/^#[A-Za-z0-9_]+$/.test(part)) {
          return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
        }

        const clean = part.slice(1).toLowerCase();
        return (
          <button
            key={`${keyPrefix}-${i}`}
            type="button"
            className="hashtag-inline-btn"
            onClick={() => handleHashtagClick(clean)}
          >
            {part}
          </button>
        );
      });

  if (router.isFallback || loading) {
    return (
      <main className="container single-blog-shell">
        <div className="single-blog-loading">Loading article...</div>
      </main>
    );
  }

  if (!blog) {
    return (
      <main className="container single-blog-shell">
        <div className="single-blog-not-found">
          <h2>Blog not found</h2>
          <button className="btn btn-secondary" onClick={() => router.push("/")}>
            Back to home
          </button>
        </div>
      </main>
    );
  }

  const contentLines = blogContent.split("\n").filter((line) => line.trim() !== "");

  return (
    <>
      {seoMeta && (
        <Head>
          <title key="title">{seoMeta.title}</title>
          <meta key="description" name="description" content={seoMeta.description} />
          <meta key="robots" name="robots" content="index, follow" />
          {seoMeta.keywords && (
            <meta key="keywords" name="keywords" content={seoMeta.keywords} />
          )}
          <link key="canonical" rel="canonical" href={seoMeta.canonicalUrl} />

          <meta key="og:type" property="og:type" content="article" />
          <meta key="og:title" property="og:title" content={seoMeta.title} />
          <meta
            key="og:description"
            property="og:description"
            content={seoMeta.description}
          />
          <meta key="og:url" property="og:url" content={seoMeta.canonicalUrl} />
          <meta key="og:image" property="og:image" content={seoMeta.image} />
          <meta
            key="article:published_time"
            property="article:published_time"
            content={seoMeta.publishedTime}
          />
          <meta
            key="article:modified_time"
            property="article:modified_time"
            content={seoMeta.modifiedTime}
          />
          <meta key="article:author" property="article:author" content={seoMeta.authorName} />

          <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
          <meta key="twitter:title" name="twitter:title" content={seoMeta.title} />
          <meta
            key="twitter:description"
            name="twitter:description"
            content={seoMeta.description}
          />
          <meta key="twitter:image" name="twitter:image" content={seoMeta.image} />
          <meta key="twitter:url" name="twitter:url" content={seoMeta.canonicalUrl} />
        </Head>
      )}
      {schemaPost && <BlogPostSchema post={schemaPost} />}

      <main className="container single-blog-shell">
        <article className="single-blog-card">
          <div className="single-blog-content">
            <div className="single-blog-header">
              <h1 className="single-blog-title">
                {renderLineWithHashtags(blog.title || "", "title")}
              </h1>
              <span className="category-badge">{blog.category}</span>
            </div>

            {!!blog.excerpt && (
              <p className="single-blog-excerpt">
                {renderLineWithHashtags(blog.excerpt, "excerpt")}
              </p>
            )}
            {blogTags.length > 0 && (
              <div className="single-blog-tag-list">
                {blogTags.map((tag) => (
                  <button
                    key={`blog-tag-${tag}`}
                    type="button"
                    className="single-blog-tag-chip"
                    onClick={() => handleHashtagClick(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {coverImageUrl && (
              <figure className="single-blog-cover-wrap">
                <img
                  src={coverImageUrl}
                  alt={blog?.title || "Blog cover image"}
                  className="single-blog-cover-image"
                  loading="lazy"
                />
              </figure>
            )}

            <div className="single-blog-meta">
              <div className="single-blog-meta-item">
                <BookOpen /> {blog?.author || blog?.User?.name || ""}
              </div>
              <div className="single-blog-meta-item">
                <Calendar /> {formatStableDate(blog.createdAt)}
              </div>
              <div className="single-blog-meta-item">
                <Clock /> {blog?.readTime ?? ""}
              </div>
            </div>

            <AdBanner
              slot={blogInlineSlot}
              className="ad-banner-inline"
              style={{ display: "block", minHeight: "90px" }}
            />

            <div className="single-blog-body">
              {hasHtmlContent ? (
                <div
                  className="single-blog-html-content"
                  dangerouslySetInnerHTML={{ __html: linkifiedHtmlContent }}
                  onClick={(e) => {
                    const anchor = e.target.closest("a.mw-hashtag-link");
                    if (!anchor) return;
                    e.preventDefault();
                    const tag = anchor.getAttribute("href")?.split("/hashtag/")[1];
                    if (tag) handleHashtagClick(decodeURIComponent(tag));
                  }}
                />
              ) : (
                (contentLines.length ? contentLines : [blog.content || ""]).map((line, index) => (
                  <p key={index}>{renderLineWithHashtags(line, `plain-${index}`)}</p>
                ))
              )}
            </div>

            <div className="single-blog-toolbar">
              <button
                className={`single-blog-action-btn ${liked ? "liked" : ""}`}
                onClick={handleLike}
              >
                <Heart fill={liked ? "currentColor" : "none"} /> <span>{blog?.likesCount ?? 0}</span>
              </button>
              <button className="single-blog-action-btn" onClick={handleComment}>
                <MessageCircle /> <span>{blog?.Comments?.length ?? 0}</span>
              </button>
              <button className="single-blog-action-btn" onClick={handleShare}>
                <Share2 /> <span>Share</span>
              </button>
              <div className="single-blog-author-chip">
                <User className="post-info-user-icon" />
                <span className="post-info-user-name">{blog?.User?.name}</span>
              </div>
            </div>

            <AdBanner
              slot={blogFooterSlot}
              className="ad-banner-inline"
              style={{ display: "block", minHeight: "120px" }}
            />
          </div>

          <div className="single-blog-comments">
            <div className="single-blog-comments-header">
              <span className="single-blog-comments-count">{blog?.Comments?.length ?? 0}</span>
              <h3>Comments</h3>
            </div>

            {blog?.Comments?.length > 0 && (
              <div className="single-blog-comments-list">
                {blog.Comments?.map((c) => (
                  <div key={c.id} className="single-blog-comment">
                    <div className="single-blog-comment-meta">
                      <User />
                      <span className="author">{c.User?.name || "Anonymous"}</span>
                      <span className="date">
                        {formatStableDate(c.date || c.createdAt)}
                      </span>
                    </div>
                    <p>{renderLineWithHashtags(c.content || "", `comment-${c.id}`)}</p>
                  </div>
                ))}
              </div>
            )}

            {(!blog?.Comments || blog.Comments.length === 0) && (
              <div className="single-blog-comments-empty">No comments yet. Start the conversation.</div>
            )}

            <form id="comment" onSubmit={handleCommentSubmit} className="single-blog-comment-form">
              <textarea
                ref={textareaRef}
                value={comment}
                onChange={handleCommentChange}
                onKeyUp={(e) => detectCommentHashtag(e.target.value, e.target.selectionStart)}
                onClick={(e) => detectCommentHashtag(e.target.value, e.target.selectionStart)}
                onFocus={(e) => detectCommentHashtag(e.target.value, e.target.selectionStart)}
                onBlur={() => hideCommentSuggestions(120)}
                placeholder="Write your comment..."
                rows="4"
                required
              />
              {showCommentTagSuggestions && (
                <div className="hashtag-suggestions">
                  {commentTagSuggestions.length > 0 ? (
                    <ul>
                      {commentTagSuggestions.map((tag) => (
                        <li
                          key={`comment-${tag.name}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectCommentHashtag(tag.name);
                          }}
                        >
                          #{tag.name}
                          <span>{tag.count || 0}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="hashtag-suggestions-empty">
                      {commentTagQuery ? "No hashtag found" : "Type to search hashtag"}
                    </div>
                  )}
                </div>
              )}
              <button type="submit" className="btn btn-primary">
                Post Comment
              </button>
            </form>
          </div>
        </article>
      </main>
    </>
  );
};

export default SingleBlogPage;
