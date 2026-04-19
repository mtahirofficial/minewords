// components/BlogPostSchema.jsx
// A reusable component — drop it into any blog post page

export default function BlogPostSchema({ post }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",

    // Core fields — pulled from your post data
    headline: post.title,
    description: post.excerpt || post.description,
    url: `https://minewords.com/blog/${post.slug}`,

    // Dates — use ISO 8601 format
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt || post.createdAt).toISOString(),

    // Cover image
    image: {
      "@type": "ImageObject",
      url: post.coverImage || "https://minewords.com/og-cover.jpg",
      width: 1200,
      height: 630,
    },

    // Author
    author: {
      "@type": "Person",
      name: post.author?.name || "MineWords Team",
      url: post.author?.slug
        ? `https://minewords.com/author/${post.author.slug}`
        : "https://minewords.com",
    },

    // Publisher (always MineWords)
    publisher: {
      "@type": "Organization",
      name: "MineWords",
      logo: {
        "@type": "ImageObject",
        url: "https://minewords.com/logo.png",
        width: 200,
        height: 60,
      },
    },

    // Breadcrumb
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://minewords.com/blog/${post.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
