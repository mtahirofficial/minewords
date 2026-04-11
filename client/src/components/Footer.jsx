import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import menu from "../menu.json";
import api from "../api";
import mineWordsLogo from "../assets/minewords-logo.png";

const Footer = () => {
  const siteName = import.meta.env.VITE_SITE_NAME?.trim() || "MineWords";
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories?limit=4");
        const items = res.data?.categories || [];
        setCategories(
          items
            .filter((item) => item?.name)
            .map((item) => ({ name: item.name, slug: item.slug })),
        );
      } catch (err) {
        console.error("Error fetching categories for footer:", err);
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
                src={mineWordsLogo}
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
                    <Link to={item.url}>{item.label}</Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h4>Categories</h4>
            <ul>
              {categories.length > 0 ? (
                categories.map((category, index) => (
                  <li key={index}>
                    <Link to={`/categories/${category.slug || "general"}`}>
                      {category.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>Loading categories...</li>
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
