import Link from "next/link";
import { useState, useEffect } from "react";
import menu from "../menu.json";
import api from "../api";
import mineWordsLogo from "../assets/minewords-logo.png";

const resolveImageSrc = (asset, fallback = "") => {
  if (typeof asset === "string") return asset;
  if (asset && typeof asset === "object" && typeof asset.src === "string") {
    return asset.src;
  }
  return fallback;
};

const Footer = () => {
  const siteName = process.env.VITE_SITE_NAME?.trim() || "MineWords";
  const logoSrc = resolveImageSrc(mineWordsLogo, "/minewords-logo.png");
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const res = await api.get("/categories?limit=4");
        const items = res.data?.categories || [];
        setCategories(
          items
            .filter((item) => item?.name)
            .map((item) => ({ name: item.name, slug: item.slug })),
        );
      } catch (err) {
        console.error("Error fetching categories for footer:", err);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const currentYear = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-wrapper">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-brand-top">
              <img
                src={logoSrc}
                alt={`${siteName} logo`}
                className="footer-logo"
              />
              <div className="footer-brand-copy">
                <h3>{siteName}</h3>
                <span className="footer-brand-tagline">
                  Creative Writing &amp; Publishing
                </span>
              </div>
            </div>
            <p>
              Your trusted source for insights, articles, and engaging content.
            </p>
          </div>
          <div>
            <h4>Navigation</h4>
            <ul>
              {menu.map((item, i) => {
                return (
                  <li key={i}>
                    <Link href={item.url}>{item.label}</Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h4>Categories</h4>
            <ul>
              {isLoadingCategories ? (
                <>
                  {[1, 2, 3, 4].map((item) => (
                    <li key={`footer-category-skeleton-${item}`}>
                      <span
                        style={{
                          display: "inline-block",
                          width: "140px",
                          height: "14px",
                          borderRadius: "6px",
                          background:
                            "linear-gradient(90deg, #eceff3 25%, #f6f8fb 50%, #eceff3 75%)",
                          backgroundSize: "200% 100%",
                        }}
                      />
                    </li>
                  ))}
                </>
              ) : categories.length > 0 ? (
                categories.map((category, index) => (
                  <li key={index}>
                    <Link href={`/categories/${category.slug || "general"}`}>
                      {category.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>No categories found.</li>
              )}
            </ul>
          </div>
          <div>
            <h4>Connect</h4>
            <p>Stay connected with our community and never miss an update.</p>
            <div className="social-icons">
              <a
                href="https://www.facebook.com/minewordsofficial"
                className="icon"
              >
                <span className="font-bold">f</span>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {currentYear} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

