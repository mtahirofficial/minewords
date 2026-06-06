import Head from "next/head";
import Link from "next/link";
import BlogCard from "../../src/components/BlogCard";
import { getServerApiBaseUrl, getSiteOrigin } from "../../src/config/runtime";

const BLOG_PAGE_LIMIT = 20;

const fetchJsonSafe = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  } catch (_error) {
    return null;
  }
};

export async function getServerSideProps() {
  const apiBase = getServerApiBaseUrl();
  const blogsUrl = `${apiBase}/blogs?page=1&limit=${BLOG_PAGE_LIMIT}`;

  const blogsPayload = await fetchJsonSafe(blogsUrl);
  const posts = Array.isArray(blogsPayload?.blogs) ? blogsPayload.blogs : [];

  return {
    props: {
      initialPosts: posts,
      totalPosts: Number(blogsPayload?.pagination?.total || posts.length || 0),
    },
  };
}

export default function BlogIndexPage({
  initialPosts = [],
  totalPosts = 0,
}) {
  const siteName = process.env.VITE_SITE_NAME?.trim() || "MineWords";
  const siteOrigin = getSiteOrigin();
  const pageTitle = `Blog - ${siteName}`;
  const pageDescription =
    "Explore the latest articles, stories, and ideas published on MineWords.";
  const canonicalUrl = `${siteOrigin}/blog`;
  const pageImage = `${siteOrigin}/files/minewords-cover.png`;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${siteName} Blog Archive`,
    url: canonicalUrl,
    numberOfItems: totalPosts,
    itemListElement: initialPosts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: post?.title || "Blog post",
      url: `${siteOrigin}/blog/${encodeURIComponent(post?.slug || post?.id)}`,
    })),
  };

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteName} Blog`,
    url: canonicalUrl,
    description: pageDescription,
    inLanguage: "en-US",
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteOrigin,
      logo: {
        "@type": "ImageObject",
        url: `${siteOrigin}/logo.png`,
        width: 200,
        height: 60,
      },
    },
  };

  return (
    <>
      <Head>
        <title key="title">{pageTitle}</title>
        <meta key="description" name="description" content={pageDescription} />
        <meta key="robots" name="robots" content="index, follow" />
        <link key="canonical" rel="canonical" href={canonicalUrl} />

        <meta key="og:type" property="og:type" content="website" />
        <meta key="og:title" property="og:title" content={pageTitle} />
        <meta
          key="og:description"
          property="og:description"
          content={pageDescription}
        />
        <meta key="og:url" property="og:url" content={canonicalUrl} />
        <meta key="og:image" property="og:image" content={pageImage} />
        <meta key="og:site_name" property="og:site_name" content={siteName} />

        <meta
          key="twitter:card"
          name="twitter:card"
          content="summary_large_image"
        />
        <meta key="twitter:title" name="twitter:title" content={pageTitle} />
        <meta
          key="twitter:description"
          name="twitter:description"
          content={pageDescription}
        />
        <meta key="twitter:image" name="twitter:image" content={pageImage} />
      </Head>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <main className="container py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c96a17]">
            Blog
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Latest from MineWords
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Fresh articles, stories, and perspectives from our writers.
          </p>
        </div>

        {initialPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {initialPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            No blog posts are available yet.
            <div className="mt-4">
              <Link href="/" className="text-[#173f6d] underline">
                Back to home
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
