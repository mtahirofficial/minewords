import React from "react";
import Link from "next/link";
import Hero from "../src/components/Hero";

const AboutPage = () => {
  const siteName = process.env.VITE_SITE_NAME?.trim() || "MineWords";

  return (
    <>
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
