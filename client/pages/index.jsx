import { useEffect, useMemo, useState, useRef } from "react";
import Head from "next/head";
import DynamicAboutBox from "../src/components/SideBar/DynamicAboutBox";
import DynamicCategoriesBox from "../src/components/SideBar/DynamicCategoriesBox";
import NewsletterBox from "../src/components/SideBar/NewsletterBox";
import { fetchBlogCategoryStats, loadBlogs } from "../src/helper";
import BlogCardSkeleton from "../src/components/BlogCardSkeleton";
import { useMain } from "../src/context/MainContext";
import Link from "next/link";
import AdBanner from "../src/components/AdBanner";
import { getServerApiBaseUrl, getSiteOrigin } from "../src/config/runtime";
import api from "../src/api";
import { resolveStaticFileUrl } from "../src/utils/staticUrl";
import blogPlaceholder from "../src/assets/blog-placeholder.svg";

const HOME_PAGE_LIMIT = 20;
const blogPlaceholderSrc = blogPlaceholder?.src || blogPlaceholder;

const fetchJsonSafe = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  } catch (_error) {
    return null;
  }
};

const resolveStoryImage = (post = "") =>
  resolveStaticFileUrl(
    post?.coverImage,
    process.env.VITE_API_URL || api.defaults.baseURL,
  );

const formatStoryDate = (post = {}) => {
  const rawDate = post?.createdAt || post?.date;
  const parsedDate = rawDate ? new Date(rawDate) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getStoryCategory = (post = {}) =>
  String(post?.category || post?.Category?.name || "Latest").trim() || "Latest";

const getStoryAuthor = (post = {}) =>
  post?.author || post?.User?.name || "MineWords";

const StoryImage = ({ post, className = "", priority = false }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = imageFailed
    ? blogPlaceholderSrc
    : resolveStoryImage(post) || blogPlaceholderSrc;

  return (
    <img
      src={imageSrc}
      alt={post?.title || "Blog cover image"}
      className={className}
      loading={priority ? "eager" : "lazy"}
      onError={() => setImageFailed(true)}
    />
  );
};

const HomeCompactStory = ({ post }) => (
  <Link
    href={`/blog/${encodeURIComponent(post.slug || post.id)}`}
    className="home-compact-story"
  >
    <article>
      <figure className="home-compact-story-media">
        <StoryImage post={post} className="home-compact-story-image" />
      </figure>
      <div className="home-compact-story-copy">
        <span className="story-kicker">{getStoryCategory(post)}</span>
        <h3>{post?.title}</h3>
        <div className="story-meta">
          <span>{formatStoryDate(post)}</span>
          {post?.readTime ? <span>{post.readTime}</span> : null}
        </div>
      </div>
    </article>
  </Link>
);

const HomeListStory = ({ post }) => (
  <Link
    href={`/blog/${encodeURIComponent(post.slug || post.id)}`}
    className="home-list-story"
  >
    <article>
      <figure className="home-list-story-media">
        <StoryImage post={post} className="home-list-story-image" />
      </figure>
      <div className="home-list-story-copy">
        <span className="story-kicker">{getStoryCategory(post)}</span>
        <h3>{post?.title}</h3>
        <div className="story-meta">
          <span>{formatStoryDate(post)}</span>
        </div>
      </div>
    </article>
  </Link>
);

const HomeGridStory = ({ post }) => (
  <Link
    href={`/blog/${encodeURIComponent(post.slug || post.id)}`}
    className="home-grid-story"
  >
    <article>
      <figure className="home-grid-story-media">
        <StoryImage post={post} className="home-grid-story-image" />
      </figure>
      <div className="home-grid-story-copy">
        <span className="story-kicker">{getStoryCategory(post)}</span>
        <h3>{post?.title}</h3>
        <div className="story-meta">
          <span>{formatStoryDate(post)}</span>
        </div>
        <p>{post?.excerpt}</p>
      </div>
    </article>
  </Link>
);

const HomeFeatureStory = ({ post }) => (
  <Link
    href={`/blog/${encodeURIComponent(post.slug || post.id)}`}
    className="home-feature-story"
  >
    <article>
      <figure className="home-feature-story-media">
        <StoryImage post={post} className="home-feature-story-image" priority />
      </figure>
      <div className="home-feature-story-copy">
        <span className="story-kicker story-kicker--center">
          {getStoryCategory(post)}
        </span>
        <h2>{post?.title}</h2>
        <p>{post?.excerpt}</p>
        <div className="story-meta story-meta--center">
          <span>{formatStoryDate(post)}</span>
          <span>{getStoryAuthor(post)}</span>
          {post?.readTime ? <span>{post.readTime}</span> : null}
        </div>
      </div>
    </article>
  </Link>
);

export async function getServerSideProps() {
  const apiBase = getServerApiBaseUrl();
  const blogsUrl = `${apiBase}/blogs?page=1&limit=${HOME_PAGE_LIMIT}`;
  const categoriesUrl = `${apiBase}/categories`;

  const [blogsPayload, categoriesPayload] = await Promise.all([
    fetchJsonSafe(blogsUrl),
    fetchJsonSafe(categoriesUrl),
  ]);

  const initialBlogs = Array.isArray(blogsPayload?.blogs)
    ? blogsPayload.blogs
    : [];
  const initialTotalPages = Number(blogsPayload?.pagination?.totalPages || 1);
  const initialCategoryStats = Array.isArray(categoriesPayload?.categories)
    ? categoriesPayload.categories
        .map((item) => ({
          name: item?.name,
          count: Number(item?.count || 0),
          slug: item?.slug,
        }))
        .filter((item) => item.name)
    : [];

  return {
    props: {
      initialBlogs,
      initialTotalPages,
      initialCategoryStats,
      initialTotalBlogs: Number(
        blogsPayload?.pagination?.total || initialBlogs.length || 0,
      ),
      serverHydrated: Boolean(blogsPayload || categoriesPayload),
    },
  };
}

const HomePage = ({
  initialBlogs = [],
  initialTotalPages = 1,
  initialCategoryStats = [],
  initialTotalBlogs = 0,
  serverHydrated = false,
}) => {
  const siteName = process.env.VITE_SITE_NAME?.trim() || "MineWords";
  const siteOrigin = getSiteOrigin();
  const heroTitle =
    "Freelancing Tips, Online Earning Guides & Creative Stories for Pakistani Readers";
  const homeTitle = `${heroTitle} | ${siteName}`;
  const homeDescription =
    "MineWords is your go-to blog for insightful articles, engaging stories, and fresh perspectives on topics that matter.";
  const homeImage = `${siteOrigin}/files/minewords-cover.png`;
  const homeCanonical = `${siteOrigin}/`;
  const homeKeywords =
    "blog, articles, stories, ideas, reading, magazine, publishing";
  const { globalSearch, setGlobalSearch, categoryStats, setCategoryStats } =
    useMain();
  const [blogs, setBlogs] = useState(initialBlogs);
  const [loading, setLoading] = useState(false);
  // const [categoryStats, setCategoryStats] = useState(initialCategoryStats);
  const [totalBlogs, setTotalBlogs] = useState(initialTotalBlogs);
  const usedServerPayloadRef = useRef(serverHydrated);

  const [page, setPage] = useState(1);
  const limit = HOME_PAGE_LIMIT;
  const [, setTotalPages] = useState(initialTotalPages);
  const fetchHomeMetaOnLoad =
    process.env.VITE_HOME_FETCH_META_ON_LOAD === "true";
  const homeInlineSlot = process.env.VITE_ADSENSE_SLOT_HOME_INLINE?.trim();
  const homeSidebarSlot = process.env.VITE_ADSENSE_SLOT_HOME_SIDEBAR?.trim();

  // Refs for scrolling
  const articlesSectionRef = useRef(null);
  const newsletterSectionRef = useRef(null);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [globalSearch]);

  // Fetch blogs using global search
  useEffect(() => {
    if (usedServerPayloadRef.current && page === 1 && !globalSearch) {
      usedServerPayloadRef.current = false;
      return;
    }

    loadBlogs({
      page,
      limit,
      search: globalSearch,
      setBlogs,
      setLoading,
      setTotalPages,
    });
  }, [page, limit, globalSearch]);

  (async () => {
    if (fetchHomeMetaOnLoad) {
      return;
    }
    if (categoryStats.length > 0) {
      return;
    }
    const catStats = await fetchBlogCategoryStats();
    setCategoryStats(catStats);
  })();

  // useEffect(() => {
  //   if (fetchHomeMetaOnLoad) {
  //     return;
  //   }

  //   const counts = blogs.reduce((acc, blog) => {
  //     if (!blog.category) return acc;
  //     acc[blog.category] = (acc[blog.category] || 0) + 1;
  //     return acc;
  //   }, {});
  //   console.log("Category counts:", counts);
  //   const stats = Object.entries(counts)
  //     .map(([name, count]) => ({ name, count }))
  //     .sort((a, b) => b.count - a.count);

  //   console.log("Category stats:", stats);
  //   setCategoryStats(stats);
  //   setTotalBlogs(blogs.length);
  // }, [blogs, fetchHomeMetaOnLoad]);

  const displayedBlogs = Array.isArray(blogs) ? blogs.filter(Boolean) : [];
  const featuredPost = displayedBlogs[0];
  const leadStories = displayedBlogs.slice(1, 3);
  const latestStories = displayedBlogs.slice(0, 4);
  const gridStories = displayedBlogs.slice(8, 12);
  const spotlightStories = displayedBlogs.slice(12, 17);
  const magazineSections = useMemo(() => {
    const fallbackNames = ["Business", "Travel", "Politics"];
    const categoryNames = Array.from(
      new Set([
        ...categoryStats.map((item) => item?.name).filter(Boolean),
        ...displayedBlogs.map((post) => getStoryCategory(post)),
      ]),
    ).filter(Boolean);

    const selectedNames = (
      categoryNames.length ? categoryNames : fallbackNames
    ).slice(0, 3);

    const fallbackSlices = [
      displayedBlogs.slice(0, 4),
      displayedBlogs.slice(4, 8),
      displayedBlogs.slice(8, 12),
    ];

    return selectedNames.map((name, index) => {
      const matchingPosts = displayedBlogs.filter(
        (post) => getStoryCategory(post).toLowerCase() === name.toLowerCase(),
      );
      const posts =
        matchingPosts.length >= 4
          ? matchingPosts.slice(0, 4)
          : matchingPosts.length > 0
            ? matchingPosts
            : fallbackSlices[index];
      const categorySlug =
        categoryStats.find(
          (item) =>
            String(item?.name || "").toLowerCase() === name.toLowerCase(),
        )?.slug || "";

      return {
        name,
        slug: categorySlug,
        posts,
      };
    });
  }, [categoryStats, displayedBlogs]);

  return (
    <>
      <Head>
        <title key="title">{homeTitle}</title>
        <meta key="description" name="description" content={homeDescription} />
        <meta key="keywords" name="keywords" content={homeKeywords} />
        <meta key="robots" name="robots" content="index, follow" />
        <link key="canonical" rel="canonical" href={homeCanonical} />

        <meta key="og:type" property="og:type" content="website" />
        <meta key="og:title" property="og:title" content={homeTitle} />
        <meta
          key="og:description"
          property="og:description"
          content={homeDescription}
        />
        <meta key="og:url" property="og:url" content={homeCanonical} />
        <meta key="og:image" property="og:image" content={homeImage} />
        <meta key="og:site_name" property="og:site_name" content={siteName} />

        <meta
          key="twitter:card"
          name="twitter:card"
          content="summary_large_image"
        />
        <meta key="twitter:title" name="twitter:title" content={homeTitle} />
        <meta
          key="twitter:description"
          name="twitter:description"
          content={homeDescription}
        />
        <meta key="twitter:image" name="twitter:image" content={homeImage} />
      </Head>
      <main
        className="container home-magazine main-container"
        ref={articlesSectionRef}
      >
        {loading ? (
          <div className="home-loading">
            <BlogCardSkeleton />
            <BlogCardSkeleton />
            <BlogCardSkeleton />
          </div>
        ) : blogs.length === 0 ? (
          <section className="home-empty-state">
            <p className="empty-text">
              {globalSearch ? (
                <>
                  No blogs found for "<strong>{globalSearch}</strong>". Try a
                  different search term.
                </>
              ) : (
                "No blogs found."
              )}
            </p>
            {globalSearch && (
              <button
                className="btn btn-secondary"
                onClick={() => setGlobalSearch("")}
              >
                Clear Search
              </button>
            )}
          </section>
        ) : (
          <>
            <section className="magazine-hero-grid">
              <div className="magazine-hero-rail">
                {leadStories.map((post) => (
                  <HomeCompactStory key={post.id} post={post} />
                ))}
              </div>

              <HomeFeatureStory post={featuredPost} />

              <aside className="magazine-hero-sidebar">
                <div className="magazine-section-head magazine-section-head--sidebar">
                  <h2>Latest</h2>
                </div>
                <div className="home-latest-list">
                  {latestStories.map((post) => (
                    <HomeListStory key={post.id} post={post} />
                  ))}
                </div>
              </aside>
            </section>

            {magazineSections.map((section) => (
              <section className="magazine-section" key={section.name}>
                <div className="magazine-section-head">
                  <h2>{section.name}</h2>
                  <Link
                    href={
                      section.slug
                        ? `/categories/${section.slug}`
                        : "/categories"
                    }
                    className="view-all-link"
                  >
                    View all »
                  </Link>
                </div>
                <div className="magazine-card-grid">
                  {(section.posts.length > 0
                    ? section.posts
                    : displayedBlogs.slice(0, 4)
                  ).map((post) => (
                    <HomeGridStory
                      key={`${section.name}-${post.id}`}
                      post={post}
                    />
                  ))}
                </div>
              </section>
            ))}

            <section className="magazine-spotlight">
              <div className="magazine-section-head">
                <h2>Politics</h2>
                <Link href="/categories" className="view-all-link">
                  View all »
                </Link>
              </div>
              <div className="magazine-spotlight-grid">
                <Link
                  href={`/blog/${encodeURIComponent(
                    (spotlightStories[0] || featuredPost)?.slug ||
                      (spotlightStories[0] || featuredPost)?.id,
                  )}`}
                  className="spotlight-feature"
                >
                  <article>
                    <figure className="spotlight-feature-media">
                      <StoryImage
                        post={spotlightStories[0] || featuredPost}
                        className="spotlight-feature-image"
                        priority
                      />
                    </figure>
                    <div className="spotlight-feature-copy">
                      <span className="story-kicker">Spotlight</span>
                      <h3>{(spotlightStories[0] || featuredPost)?.title}</h3>
                      <p>{(spotlightStories[0] || featuredPost)?.excerpt}</p>
                      <div className="story-meta">
                        <span>
                          {formatStoryDate(spotlightStories[0] || featuredPost)}
                        </span>
                        <span>
                          {getStoryAuthor(spotlightStories[0] || featuredPost)}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>

                <div className="spotlight-story-stack">
                  {spotlightStories.slice(1, 5).map((post) => (
                    <HomeListStory key={`spotlight-${post.id}`} post={post} />
                  ))}
                </div>
              </div>
            </section>

            <section className="home-side-panels">
              {/* <DynamicAboutBox
                siteName={siteName}
                totalPosts={totalBlogs}
                totalCategories={categoryStats.length}
              />
              <DynamicCategoriesBox categories={categoryStats} /> */}
              <AdBanner
                slot={homeInlineSlot}
                className="ad-banner-inline"
                style={{ display: "block", minHeight: "100px" }}
              />
              <AdBanner
                slot={homeSidebarSlot}
                className="ad-banner-sidebar"
                style={{ display: "block", minHeight: "250px" }}
              />
              <div ref={newsletterSectionRef} id="newsletter">
                <NewsletterBox />
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
};
export default HomePage;
