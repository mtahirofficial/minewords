import { Search, X } from "lucide-react";
import MenuList from "./MenuList";
import { useRouter } from "next/router";
import { useMain } from "../context/MainContext";
import { useState, useEffect } from "react";

const MobileMenu = ({ setIsMenuOpen }) => {
    const { globalSearch, setGlobalSearch } = useMain();
    const [searchValue, setSearchValue] = useState("");
    const router = useRouter();
    const pathname = router.asPath.split("?")[0];

    // Sync local search value with global search
    useEffect(() => {
        setSearchValue(globalSearch);
    }, [globalSearch]);

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
        <div className="mobile-menu">
            <div className="menu-inner">
                <MenuList setIsMenuOpen={setIsMenuOpen} />
                <div className="search-wrapper">
                    <form className="search-container" onSubmit={handleSearchSubmit}>
                        <Search className="search-icon" />
                        <input 
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
            </div>
        </div>

    );
};

export default MobileMenu;
