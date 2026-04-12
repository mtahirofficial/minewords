import { useEffect, useState, useRef } from "react";
import BlogCard from "../components/BlogCard";
import Hero from "../components/Hero";
import DynamicAboutBox from "../components/SideBar/DynamicAboutBox";
import DynamicCategoriesBox from "../components/SideBar/DynamicCategoriesBox";
import NewsletterBox from "../components/SideBar/NewsletterBox";
import { loadBlogs, useHandleCheckLogin } from "../helper";
import BlogCardSkeleton from "../components/BlogCardSkeleton";
import Pagination from "../components/Pagination";
import { useMain } from "../context/MainContext";
import { Link } from "react-router-dom";
import AdBanner from "../components/AdBanner";

const HomePage = () => {
  const siteName = import.meta.env.VITE_SITE_NAME?.trim() || "MineWords";
  const handleCheckLogin = useHandleCheckLogin();
  const { globalSearch, setGlobalSearch } = useMain();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryStats, setCategoryStats] = useState([]);
  const [totalBlogs, setTotalBlogs] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 5;
  const [totalPages, setTotalPages] = useState(1);
  const fetchHomeMetaOnLoad =
    import.meta.env.VITE_HOME_FETCH_META_ON_LOAD === "true";
  const homeInlineSlot = import.meta.env.VITE_ADSENSE_SLOT_HOME_INLINE?.trim();
  const homeSidebarSlot =
    import.meta.env.VITE_ADSENSE_SLOT_HOME_SIDEBAR?.trim();

  // Refs for scrolling
  const articlesSectionRef = useRef(null);
  const newsletterSectionRef = useRef(null);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [globalSearch]);

  // Fetch blogs using global search
  useEffect(() => {
    loadBlogs({
      page,
      limit,
      search: globalSearch,
      setBlogs,
      setLoading,
      setTotalPages,
    });
  }, [page, limit, globalSearch]);

  useEffect(() => {
    if (fetchHomeMetaOnLoad) {
      return;
    }

    const counts = blogs.reduce((acc, blog) => {
      if (!blog.category) return acc;
      acc[blog.category] = (acc[blog.category] || 0) + 1;
      return acc;
    }, {});

    const stats = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    setCategoryStats(stats);
    setTotalBlogs(blogs.length);
  }, [blogs, fetchHomeMetaOnLoad]);

  // Scroll to articles section
  const handleReadArticles = () => {
    if (articlesSectionRef.current) {
      articlesSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Scroll to newsletter section
  const handleSubscribeNewsletter = () => {
    if (newsletterSectionRef.current) {
      newsletterSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // Focus on the newsletter input after a short delay
      setTimeout(() => {
        const newsletterInput =
          newsletterSectionRef.current?.querySelector("input");
        if (newsletterInput) {
          newsletterInput.focus();
        }
      }, 500);
    }
  };

  const heroDescription =
    "Your go-to source for the latest insights, tutorials, and discussions on a wide variety of topics.";

  return (
    <>
      <Hero
        title={`Welcome to ${siteName}`}
        description={heroDescription}
        primarytext={"Read Latest Articles"}
        primaryAction={handleReadArticles}
        secondaryText={"Subscribe to Newsletter"}
        secondaryAction={handleSubscribeNewsletter}
      />
      <main className="container" ref={articlesSectionRef}>
        <div className="content-flex">
          <div className="left-column">
            <div className="section-header">
              <div className="header-content">
                <h2>
                  {globalSearch ? (
                    <>
                      Search Results
                      {blogs.length > 0 && (
                        <span className="search-count"> ({blogs.length})</span>
                      )}
                    </>
                  ) : (
                    "Latest Articles"
                  )}
                </h2>
                <p>
                  {globalSearch ? (
                    <>
                      Showing results for "<strong>{globalSearch}</strong>"
                    </>
                  ) : (
                    "Stay up to date with the latest articles and insights on various topics."
                  )}
                </p>
              </div>
              <Link
                to="/create"
                className="btn btn-primary"
                onClick={(e) => {
                  const isLogged = handleCheckLogin();
                  if (!isLogged) {
                    e.preventDefault();
                  }
                }}
              >
                Create Blog
              </Link>
              {/* <Link to={"/create"} className="create-blog-btn">Create New Blog</Link> */}
            </div>
            <div className="section-body">
              <AdBanner
                slot={homeInlineSlot}
                className="ad-banner-inline"
                style={{ display: "block", minHeight: "100px" }}
              />
              {loading ? (
                <div className="skeleton-wrapper">
                  <BlogCardSkeleton />
                  <BlogCardSkeleton />
                  <BlogCardSkeleton />
                </div>
              ) : blogs.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-text">
                    {globalSearch ? (
                      <>
                        No blogs found for "<strong>{globalSearch}</strong>".
                        Try a different search term.
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
                </div>
              ) : (
                <div className="blog-list">
                  {blogs.map((b) => (
                    <BlogCard key={b.id} post={b} />
                  ))}
                </div>
              )}
              <Pagination
                page={page}
                setPage={setPage}
                totalPages={totalPages}
              />
            </div>
          </div>

          <div className="right-column">
            <DynamicAboutBox
              siteName={siteName}
              totalPosts={totalBlogs}
              totalCategories={categoryStats.length}
            />
            <DynamicCategoriesBox categories={categoryStats} />
            <AdBanner
              slot={homeSidebarSlot}
              className="ad-banner-sidebar"
              style={{ display: "block", minHeight: "250px" }}
            />
            <div ref={newsletterSectionRef}>
              <NewsletterBox />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
export default HomePage;

