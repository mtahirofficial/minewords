import React from "react";
import Head from "next/head";
import Link from "next/link";
import Hero from "../src/components/Hero";
import { getSiteOrigin } from "../src/config/runtime";
import { getAuthorProfiles } from "../src/data/authors";

const AboutPage = () => {
  const siteName = process.env.VITE_SITE_NAME?.trim() || "MineWords";
  const siteOrigin = getSiteOrigin();
  const pageTitle = `About | ${siteName}`;
  const pageDescription =
    "Learn how MineWords started in 2025, who writes for it, and the editorial standards behind the site.";
  const canonicalUrl = `${siteOrigin}/about`;
  const pageImage = `${siteOrigin}/files/minewords-cover.png`;
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
        <meta key="og:image" property="og:image" content={pageImage} />
        <meta key="og:site_name" property="og:site_name" content={siteName} />
        <meta key="og:locale" property="og:locale" content="en_US" />
        <meta
          key="og:image:alt"
          property="og:image:alt"
          content="MineWords editorial team and publishing profile"
        />
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
          content="MineWords editorial team and publishing profile"
        />
      </Head>
      <Hero
        title={`About ${siteName}`}
        description={
          "MineWords started in 2025 as a practical publishing project for readers who want useful guides, thoughtful stories, and honest editorial context."
        }
      />
      <main className="container">
        <div className="about-page-content">
          <section className="about-section">
            <h2>Our Story</h2>
            <p>
              {siteName} launched in 2025 as a focused editorial project built
              around practical freelancing advice, online earning guides, and
              long-form stories for Pakistani readers.
            </p>
            <p>
              The editorial mix grew from quick how-to content into a broader
              publishing rhythm that balances utility, curiosity, and clear
              writing. We now publish guides, commentary, and feature-style
              posts that are easy to apply and worth revisiting.
            </p>
          </section>

          <section className="about-section">
            <h2>Our Values</h2>
            <div className="values-list">
              <div className="value-item">
                <h3>Community First</h3>
                <p>
                  We prioritize readers and contributors by keeping the tone
                  practical, accessible, and respectful.
                </p>
              </div>
              <div className="value-item">
                <h3>Quality Content</h3>
                <p>
                  We publish articles that explain the why, not just the what,
                  so the content can actually be used.
                </p>
              </div>
              <div className="value-item">
                <h3>Open Dialogue</h3>
                <p>
                  We encourage thoughtful disagreement, editorial clarity, and
                  room for multiple perspectives when the topic calls for it.
                </p>
              </div>
              <div className="value-item">
                <h3>Continuous Learning</h3>
                <p>
                  We treat every article as a chance to learn something, improve
                  the explanation, and make the next post more useful.
                </p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Editorial Team</h2>
            <div className="author-profile-grid">
              {authors.map((author) => (
                <article key={author.slug} className="author-profile-card">
                  <img
                    src={author.avatarUrl}
                    alt={author.avatarAlt}
                    className="author-profile-avatar"
                    loading="lazy"
                  />
                  <h3>{author.name}</h3>
                  <p className="author-profile-role">
                    {author.role} | Publishing since {author.since}
                  </p>
                  <p>{author.bio}</p>
                  <Link href={`/author/${author.slug}`} className="inline-link">
                    Read profile
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="about-section">
            <h2>Join Our Community</h2>
            <p>
              Whether you are a reader, a writer, or someone with a story to
              share, we welcome you to join the conversation.
            </p>
            <p>
              If you want to pitch a story, suggest a correction, or connect
              with the editorial desk, feel free to{" "}
              <Link href="/contact" className="inline-link">
                reach out to us
              </Link>{" "}
              and we will get back to you.
            </p>
          </section>
        </div>
      </main>
    </>
  );
};

export default AboutPage;
