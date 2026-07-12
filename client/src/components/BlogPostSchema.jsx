import { getSiteOrigin } from "../config/runtime";

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function BlogPostSchema({ post }) {
  const siteOrigin = getSiteOrigin();
  const schema = {
    "@context": "http://schema.org",
    "@type": "Article",
    headline: post.title,
    author: {
      "@type": "Person",
      name: post.authorName || post.author?.name || "MineWords Team",
    },
    datePublished:
      post.publishedTime || post.datePublished || post.createdAt || "",
    image: post.image,
    articleBody:
      post.articleBody ||
      stripHtml(post.content || post.description || post.excerpt || ""),
  };
  console.log("schema", schema);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
