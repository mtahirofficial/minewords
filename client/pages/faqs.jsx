import Head from "next/head";
import Hero from "../src/components/Hero";
import FAQ, { FAQ_ITEMS } from "../src/components/FAQ";
import { getSiteOrigin } from "../src/config/runtime";

const FaqsPage = () => {
  const siteName = process.env.VITE_SITE_NAME?.trim() || "MineWords";
  const siteOrigin = getSiteOrigin();
  const pageTitle = `FAQs | ${siteName}`;
  const pageDescription =
    "Find answers to common questions about MineWords, posting, support, and collaboration.";
  const canonicalUrl = `${siteOrigin}/faqs`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
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
        <meta key="og:description" property="og:description" content={pageDescription} />
        <meta key="og:url" property="og:url" content={canonicalUrl} />
        <meta key="twitter:card" name="twitter:card" content="summary" />
        <meta key="twitter:title" name="twitter:title" content={pageTitle} />
        <meta key="twitter:description" name="twitter:description" content={pageDescription} />
        <script
          key="ld-faq-page"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </Head>

      <Hero
        title="Frequently Asked Questions"
        description="Quick answers to the most common questions about MineWords."
      />

      <main className="container">
        <section className="faq-page-intro">
          <p>
            Need help? Browse our most common questions below. If you still need
            assistance, visit our contact page and we will help you quickly.
          </p>
        </section>
        <FAQ showTitle={false} />
      </main>
    </>
  );
};

export default FaqsPage;
