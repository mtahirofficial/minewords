import { getSiteOrigin } from "../config/runtime";

export default function BlogPostSchema({ post }) {
  const siteOrigin = getSiteOrigin();
  const postUrl = post.canonicalUrl || `${siteOrigin}/blog/${post.slug}`;
  const authorUrl =
    post.authorUrl ||
    (post.author?.slug
      ? `${siteOrigin}/author/${post.author.slug}`
      : siteOrigin);
  const imageUrl = post.image || `${siteOrigin}/og-cover.jpg`;
  const keywords = Array.isArray(post.keywords)
    ? post.keywords
    : String(post.keywords || "")
        .split(",")
        .map((item) => item.trim().replace(/^#+/, ""))
        .filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description || post.excerpt || "",
    url: postUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    inLanguage: post.locale || "en-US",
    datePublished: post.publishedTime,
    dateModified: post.modifiedTime || post.publishedTime,
    image: {
      "@type": "ImageObject",
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    author: {
      "@type": "Person",
      name: post.authorName || post.author?.name || "MineWords Team",
      url: authorUrl,
    },
    publisher: {
      "@type": "Organization",
      name: post.publisherName || "MineWords",
      url: siteOrigin,
      logo: {
        "@type": "ImageObject",
        url: `${siteOrigin}/logo.png`,
        width: 200,
        height: 60,
      },
    },
  };

  if (keywords.length > 0) {
    schema.keywords = keywords.join(", ");
  }

  if (post.articleSection) {
    schema.articleSection = post.articleSection;
  }

  if (post.wordCount) {
    schema.wordCount = post.wordCount;
  }

  if (post.isAccessibleForFree !== undefined) {
    schema.isAccessibleForFree = Boolean(post.isAccessibleForFree);
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
