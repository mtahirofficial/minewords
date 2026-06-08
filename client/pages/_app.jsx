import "../src/index.css";
import "../src/App.css";
import "../src/editor.css";
import "quill/dist/quill.snow.css";

import { Fragment, StrictMode, useEffect } from "react";
import Head from "next/head";
import Script from "next/script";

import { useRouter } from "next/router";
import { AuthProvider } from "../src/context/AuthContext.jsx";
import { MainProvider } from "../src/context/MainContext.jsx";
import AppLayout from "../src/App.jsx";
import { getSiteOrigin } from "../src/config/runtime";

const siteOrigin = getSiteOrigin();

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MineWords",
  url: siteOrigin,
  logo: {
    "@type": "ImageObject",
    url: `${siteOrigin}/logo.png`,
    width: 200,
    height: 60,
  },
  description:
    "MineWords is a blog and publishing platform for insightful articles, stories, and fresh perspectives.",
  sameAs: [
    "https://twitter.com/minewords",
    "https://facebook.com/minewords",
    "https://instagram.com/minewords",
    "https://linkedin.com/company/minewords",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "hello@minewords.com",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MineWords",
  url: siteOrigin,
  description:
    "Your go-to blog for insightful articles, fresh perspectives, and stories that spark curiosity.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteOrigin}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "MineWords",
  url: siteOrigin,
  description:
    "A blog publishing insightful articles, engaging stories, and fresh perspectives for curious readers.",
  publisher: {
    "@type": "Organization",
    name: "MineWords",
    logo: {
      "@type": "ImageObject",
      url: `${siteOrigin}/logo.png`,
    },
  },
  inLanguage: "en-US",
};

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();

  const clarityProjectId =
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ||
    process.env.VITE_CLARITY_PROJECT_ID;

  const enableStrictMode =
    process.env.NEXT_PUBLIC_ENABLE_STRICT_MODE === "true" ||
    process.env.VITE_ENABLE_STRICT_MODE === "true";
  const RootWrapper = enableStrictMode ? StrictMode : Fragment;

  useEffect(() => {
    if (!clarityProjectId) return;

    const handleRouteChange = (url) => {
      if (
        typeof window !== "undefined" &&
        typeof window.clarity === "function"
      ) {
        window.clarity("set", "page", url);
      }
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    handleRouteChange(router.asPath);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events, clarityProjectId]);

  return (
    <RootWrapper>
      <Head>
        <title key="title">MineWords - Words Worth Reading.</title>
        <meta key="author" name="author" content="MineWords" />
        <meta
          key="description"
          name="description"
          content="MineWords is your go-to blog for insightful articles, engaging stories, and fresh perspectives on topics that matter."
        />
        <meta
          key="keywords"
          name="keywords"
          content="blog, articles, stories, ideas, reading, magazine, publishing"
        />
        <meta key="robots" name="robots" content="index, follow" />
        <link key="canonical" rel="canonical" href={`${siteOrigin}/`} />
        <link rel="icon" type="image/png" href="/minewords-logo.png" />

        <meta
          key="og:title"
          property="og:title"
          content="MineWords - Words Worth Reading"
        />
        <meta
          key="og:description"
          property="og:description"
          content="Your go-to blog for insightful articles, fresh perspectives, and stories that spark curiosity."
        />
        <meta key="og:type" property="og:type" content="website" />
        <meta key="og:url" property="og:url" content={`${siteOrigin}/`} />
        <meta
          key="og:image"
          property="og:image"
          content={`${siteOrigin}/files/minewords-cover.png`}
        />
        <meta key="og:image:width" property="og:image:width" content="1200" />
        <meta key="og:image:height" property="og:image:height" content="630" />
        <meta key="og:site_name" property="og:site_name" content="MineWords" />
        <meta key="og:locale" property="og:locale" content="en_US" />

        <meta
          key="twitter:card"
          name="twitter:card"
          content="summary_large_image"
        />
        <meta key="twitter:site" name="twitter:site" content="@minewords" />
        <meta
          key="twitter:title"
          name="twitter:title"
          content="MineWords - Words Worth Reading."
        />
        <meta
          key="twitter:description"
          name="twitter:description"
          content="Your go-to blog for insightful articles, fresh perspectives, and stories that spark curiosity."
        />
        <meta
          key="twitter:image"
          name="twitter:image"
          content={`${siteOrigin}/files/minewords-cover.png`}
        />
        <meta
          key="twitter:image:alt"
          name="twitter:image:alt"
          content="MineWords - Blog and magazine for curious readers"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
        />
      </Head>

      <Script
        id="google-tag-loader"
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-2WNGNYBM8F"
      />
      <Script id="google-tag" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-2WNGNYBM8F');
      `}</Script>

      {clarityProjectId ? (
        <Script id="ms-clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityProjectId}");
        `}</Script>
      ) : null}

      <Script id="ahrefs-analytics" strategy="afterInteractive">{`
        (function() {
          var script = document.createElement('script');
          script.src = 'https://analytics.ahrefs.com/analytics.js';
          script.setAttribute('data-key', 'BCPYEPfKQOzu9AOkEynSSg');
          script.async = true;
          document.head.appendChild(script);
        })();
      `}</Script>

      <AuthProvider>
        <MainProvider>
          <AppLayout>
            <Component {...pageProps} />
          </AppLayout>
        </MainProvider>
      </AuthProvider>
    </RootWrapper>
  );
}
