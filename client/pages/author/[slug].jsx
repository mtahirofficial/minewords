import Head from "next/head";
import Link from "next/link";
import { useMemo } from "react";
import BlogCard from "../../src/components/BlogCard";
import Hero from "../../src/components/Hero";
import { getServerApiBaseUrl, getSiteOrigin } from "../../src/config/runtime";
import { getAuthorProfile, getAuthorSlug } from "../../src/data/authors";
import { slugifyText } from "../../src/helper";

const AUTHOR_PAGE_LIMIT = 1000;

const fetchJsonSafe = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  } catch (_error) {
    return null;
  }
};

export async function getServerSideProps({ params }) {
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  if (!slug) {
    return { notFound: true };
  }

  const apiBase = getServerApiBaseUrl();
  const blogsUrl = `${apiBase}/blogs?page=1&limit=${AUTHOR_PAGE_LIMIT}`;
  const blogsPayload = await fetchJsonSafe(blogsUrl);
  const posts = Array.isArray(blogsPayload?.blogs) ? blogsPayload.blogs : [];
  const profile = getAuthorProfile(slug);

  const authorName = profile.name || slugifyText(slug, "author");
  const normalizedSlug = getAuthorSlug(authorName);

  const authoredPosts = posts.filter((post) => {
    const postAuthorName =
      (post?.author && typeof post.author === "object" && post.author?.name) ||
      post?.author ||
      post?.User?.name ||
      "";
    const postAuthorSlug =
      post?.User?.slug ||
      getAuthorSlug(postAuthorName || post?.User?.name || postAuthorName);

    return (
      postAuthorSlug === normalizedSlug ||
      slugifyText(postAuthorName, "author") === normalizedSlug
    );
  });

  return {
    props: {
      profile,
      posts: authoredPosts,
    },
  };
}

export default function AuthorPage({ profile, posts = [] }) {
  const siteName = process.env.VITE_SITE_NAME?.trim() || "MineWords";
  const siteOrigin = getSiteOrigin();
  const pageTitle = `${profile.name} | ${siteName}`;
  const pageDescription = profile.bio;
  const canonicalUrl = `${siteOrigin}/author/${profile.slug}`;
  const pageImage = profile.avatarUrl;

  const personSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.name,
      jobTitle: profile.role,
      description: profile.bio,
      image: pageImage,
      url: canonicalUrl,
      worksFor: {
        "@type": "Organization",
        name: siteName,
        url: siteOrigin,
      },
      knowsAbout: profile.topics || [],
      sameAs:
        profile.socialLinks
          ?.map((link) => link.href)
          .filter((href) => /^https?:\/\//i.test(href)) || [],
    }),
    [canonicalUrl, pageImage, profile.bio, profile.name, profile.role, profile.socialLinks, profile.topics, siteName, siteOrigin],
  );

  return (
    <>
      <Head>
        <title key="title">{pageTitle}</title>
        <meta key="description" name="description" content={pageDescription} />
        <meta key="robots" name="robots" content="index, follow" />
        <link key="canonical" rel="canonical" href={canonicalUrl} />
        <meta key="og:type" property="og:type" content="profile" />
        <meta key="og:title" property="og:title" content={pageTitle} />
        <meta
          key="og:description"
          property="og:description"
          content={pageDescription}
        />
        <meta key="og:url" property="og:url" content={canonicalUrl} />
        <meta key="og:image" property="og:image" content={pageImage} />
        <meta
          key="og:image:alt"
          property="og:image:alt"
          content={`${profile.name} profile image`}
        />
        <meta key="og:site_name" property="og:site_name" content={siteName} />
        <meta key="og:locale" property="og:locale" content="en_US" />
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
        <meta
          key="twitter:image:alt"
          name="twitter:image:alt"
          content={`${profile.name} profile image`}
        />
        <script
          key="ld-person"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </Head>

      <Hero
        title={profile.name}
        description={profile.bio}
        primarytext="View latest posts"
        primaryAction={() =>
          document
            .querySelector(".author-posts")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      />

      <main className="container">
        <section className="about-section author-profile-shell">
          <div className="author-profile-header">
            <img
              src={pageImage}
              alt={profile.avatarAlt}
              className="author-profile-avatar author-profile-avatar-lg"
              loading="lazy"
            />
            <div>
              <p className="author-profile-role">
                {profile.role} | Publishing since {profile.since}
              </p>
              <h2>What they cover</h2>
              <p>{profile.bio}</p>
              <div className="author-topic-list">
                {profile.topics.map((topic) => (
                  <span key={topic} className="author-topic-chip">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="author-profile-grid">
            <div className="author-profile-card">
              <h3>Editorial credentials</h3>
              <ul className="author-credential-list">
                {profile.credentials.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="author-profile-card">
              <h3>Links</h3>
              <ul className="author-social-list">
                {profile.socialLinks.map((link) => (
                  <li key={`${profile.slug}-${link.label}`}>
                    {link.href.startsWith("http") ? (
                      <a href={link.href} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="author-posts about-section">
          <h2>Latest articles by {profile.name}</h2>
          {posts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
              No published posts are available for this author yet.
              <div className="mt-4">
                <Link href="/blog" className="text-[#173f6d] underline">
                  Browse all posts
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
