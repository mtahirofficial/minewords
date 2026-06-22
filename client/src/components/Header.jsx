import { Search, Menu, X, Circle } from "lucide-react";
import MenuList from "./MenuList";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { useMain } from "../context/MainContext";
import { useState, useEffect, useRef } from "react";
import mineWordsLogo from "../assets/minewords-logo.png";

const resolveImageSrc = (asset, fallback = "") => {
  if (typeof asset === "string") return asset;
  if (asset && typeof asset === "object" && typeof asset.src === "string") {
    return asset.src;
  }
  return fallback;
};

const Header = ({ isMenuOpen, setIsMenuOpen }) => {
  const siteName = process.env.VITE_SITE_NAME?.trim() || "MineWords";
  const logoSrc = resolveImageSrc(mineWordsLogo, "/minewords-logo.png");
  const { user, logout } = useAuth();
  const { globalSearch, setGlobalSearch } = useMain();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();
  const pathname = router.asPath.split("?")[0];
  const isHomePage = pathname === "/";
  const searchInputRef = useRef(null);

  useEffect(() => {
    setSearchValue(globalSearch);
  }, [globalSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest(".user-dropdown")) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setGlobalSearch(searchValue.trim());
      if (pathname !== "/") {
        router.push("/");
      }
      setTimeout(() => {
        const articlesSection = document.querySelector(".main-container");
        if (articlesSection) {
          articlesSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    }
  };

  const handleSearchClear = () => {
    setSearchValue("");
    setGlobalSearch("");
  };

  const handleSubscribeClick = () => {
    const newsletterTarget = document.querySelector("#newsletter");
    if (isHomePage && newsletterTarget) {
      newsletterTarget.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    router.push("/#newsletter");
  };

  return (
    <header className={`site-header`}>
      <div className="max-width">
        <div className="inner-header">
          <div className="header-toolbar" aria-label="Header tools">
            {/* <button
              type="button"
              className="header-icon-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              <Menu size={18} />
            </button> */}
            {/* <button
              type="button"
              className="header-icon-button"
              onClick={() => searchInputRef.current?.focus()}
              aria-label="Focus search"
            >
              <Search size={18} />
            </button> */}
            <form className="desktop-search" onSubmit={handleSearchSubmit}>
              <Search className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search articles..."
                value={searchValue}
                onChange={handleSearchChange}
              />
              {searchValue && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={handleSearchClear}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </form>
          </div>

          <Link href="/" className="brand-link" aria-label={`${siteName} home`}>
            <img
              src={logoSrc}
              alt={`MineWords â€“ Freelancing and earning blog for Pakistan`}
              className="brand-logo-image"
            />
            <span className="brand-copy">
              <span className="brand-name">{siteName}</span>
              <span className="brand-tagline">
                Creative Writing &amp; Publishing
              </span>
            </span>
          </Link>

          <div className="right-side">
            {/* <button
              type="button"
              className="subscribe-link"
              onClick={handleSubscribeClick}
            >
              Subscribe
            </button> */}
            <button
              type="button"
              className="header-icon-button header-icon-button--ghost"
              aria-hidden="true"
              tabIndex={-1}
            >
              <Circle size={10} />
            </button>

            <div
              className={`account-area${isHomePage ? " account-area--home" : ""}`}
            >
              {user ? (
                <div className="user-dropdown">
                  <button
                    className="user-button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#f5f5f5",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 14px",
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "#1a1a1a",
                      cursor: "pointer",
                      boxShadow: userMenuOpen
                        ? "0 2px 8px rgba(0,0,0,0.08)"
                        : "none",
                      transition: "box-shadow 0.18s",
                    }}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
                  >
                    <span
                      style={{
                        marginRight: "8px",
                        fontWeight: "600",
                        color: "#173f6d",
                      }}
                    >
                      {user.name}
                    </span>
                    <svg
                      className="arrow"
                      style={{
                        transition: "transform 0.2s",
                        transform: userMenuOpen ? "rotate(180deg)" : "none",
                        width: "18px",
                        height: "18px",
                        color: "#173f6d",
                      }}
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 8 10 12 14 8" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="dropdown-menu">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button onClick={logout}>Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login" className="account-link">
                    Login
                  </Link>
                  <Link href="/signup" className="account-link signup-btn">
                    Signup
                  </Link>
                </>
              )}
            </div>

            <button
              className="menu-toggle-button"
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      <nav className="top-menu">
        <div className="menu-items">
          <div className="max-width">
            <MenuList />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
