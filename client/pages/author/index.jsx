import Head from "next/head";
import Link from "next/link";
import Hero from "../../src/components/Hero";
import { getSiteOrigin } from "../../src/config/runtime";
import { getAuthorProfiles } from "../../src/data/authors";

export default function AuthorIndexPage() {
  const siteName = process.env.VITE_SITE_NAME?.trim() || "MineWords";
  const siteOrigin = getSiteOrigin();
  const pageTitle = `Authors | ${siteName}`;
  const pageDescription =
    "Meet the writers behind MineWords, read their profiles, and explore their latest articles.";
  const canonicalUrl = `${siteOrigin}/author`;
  const authors = getAuthorProfiles();

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
        <meta
          key="og:image"
          property="og:image"
          content={`${siteOrigin}/files/minewords-cover.png`}
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
        <meta
          key="twitter:image"
          name="twitter:image"
          content={`${siteOrigin}/files/minewords-cover.png`}
        />
      </Head>

      <Hero
        title="Authors"
        description="Browse the MineWords editorial contributors and read their individual profiles."
      />

      <main className="container">
        <section className="about-section">
          <div className="author-profile-grid">
            {authors.map((author) => (
              <article key={author.slug} className="author-profile-card">
                <img
                  src={author.avatarUrl}
                  alt={author.avatarAlt}
                  className="author-profile-avatar"
                  loading="lazy"
                />
                <h2>{author.name}</h2>
                <p className="author-profile-role">
                  {author.role} | Publishing since {author.since}
                </p>
                <p>{author.bio}</p>
                <Link href={`/author/${author.slug}`} className="inline-link">
                  Open profile
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
