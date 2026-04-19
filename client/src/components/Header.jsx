import { Search, Menu, X } from "lucide-react";
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
    const searchInputRef = useRef(null);

    // Sync local search value with global search
    useEffect(() => {
        setSearchValue(globalSearch);
    }, [globalSearch]);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuOpen && !event.target.closest('.user-dropdown')) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [userMenuOpen]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchValue(value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchValue.trim()) {
            setGlobalSearch(searchValue.trim());
            // Navigate to home page if not already there
            if (pathname !== '/') {
                router.push('/');
            }
            // Scroll to articles section after a short delay
            setTimeout(() => {
                const articlesSection = document.querySelector('.main-container');
                if (articlesSection) {
                    articlesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    };

    const handleSearchClear = () => {
        setSearchValue("");
        setGlobalSearch("");
    };
    return (
        <header className="site-header">
            <div className="max-width">
                <div className="inner-header">
                    <Link href="/" className="brand-link" aria-label={`${siteName} home`}>
                        <img src={logoSrc} alt={`${siteName} logo`} className="brand-logo-image" />
                        <span className="brand-copy">
                            <span className="brand-name">{siteName}</span>
                            <span className="brand-tagline">Creative Writing &amp; Publishing</span>
                        </span>
                    </Link>

                    <nav>
                        <div className="menu-items">
                            <MenuList />
                        </div>
                    </nav>

                    <div className="right-side">
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

                        <div className="account-area">
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
                                            boxShadow: userMenuOpen ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                                            transition: "box-shadow 0.18s"
                                        }}
                                        aria-haspopup="true"
                                        aria-expanded={userMenuOpen}
                                    >
                                        <span style={{
                                            marginRight: "8px",
                                            fontWeight: "600",
                                            color: "#173f6d"
                                        }}>{user.name}</span>
                                        <svg
                                            className="arrow"
                                            style={{ transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'none', width: "18px", height: "18px", color: "#173f6d" }}
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
                                            {/* <Link to="/profile">Profile</Link> */}
                                            <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}>Dashboard</Link>
                                            <button onClick={logout}>Logout</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link href="/login" className="account-link">Login</Link>
                                    <Link href="/signup" className="account-link signup-btn">Signup</Link>
                                </>
                            )}
                        </div>

                        <button
                            className="menu-toggle-button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>

                </div>
            </div>
        </header>

    );
};

export default Header;

