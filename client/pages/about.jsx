import React from "react";
import Head from "next/head";
import Link from "next/link";
import Hero from "../src/components/Hero";
import { getSiteOrigin } from "../src/config/runtime";

const AboutPage = () => {
  const siteName = process.env.VITE_SITE_NAME?.trim() || "MineWords";
  const siteOrigin = getSiteOrigin();
  const pageTitle = `About | ${siteName}`;
  const pageDescription =
    "Learn about MineWords, our mission, values, and the community we're building.";
  const canonicalUrl = `${siteOrigin}/about`;
  const pageImage = `${siteOrigin}/files/minewords-cover.png`;

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
      <Hero
        title={"About Us"}
        description={
          "Learn more about our mission, values, and the community we're building."
        }
      />
      <main className="container">
        <div className="about-page-content">
          <section className="about-section">
            <h2>Our Story</h2>
            <p>
              {siteName} is a community-driven platform for sharing knowledge and
              insights. We believe in the power of sharing information and
              connecting people through meaningful content.
            </p>
            <p>
              Our mission is to create a space where writers and readers can
              come together to explore ideas, learn from each other, and build a
              vibrant community around diverse topics and perspectives.
            </p>
          </section>

          <section className="about-section">
            <h2>Our Values</h2>
            <div className="values-list">
              <div className="value-item">
                <h3>Community First</h3>
                <p>
                  We prioritize our community members and their contributions,
                  creating an inclusive and welcoming environment for everyone.
                </p>
              </div>
              <div className="value-item">
                <h3>Quality Content</h3>
                <p>
                  We believe in the importance of well-researched, thoughtful
                  content that adds value to our readers' lives.
                </p>
              </div>
              <div className="value-item">
                <h3>Open Dialogue</h3>
                <p>
                  We encourage open discussions, diverse perspectives, and
                  respectful conversations on a wide range of topics.
                </p>
              </div>
              <div className="value-item">
                <h3>Continuous Learning</h3>
                <p>
                  We support lifelong learning and believe that knowledge should
                  be accessible and shared freely.
                </p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Join Our Community</h2>
            <p>
              Whether you're a writer looking to share your insights or a reader
              seeking valuable content, we welcome you to join our growing
              community. Together, we can create something meaningful.
            </p>
            <p>
              Have questions or want to get involved? Feel free to{" "}
              <Link href="/contact" className="inline-link">
                reach out to us
              </Link>{" "}
              - we'd love to hear from you!
            </p>
          </section>
        </div>
      </main>
    </>
  );
};

export default AboutPage;
