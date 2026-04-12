import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import CategoriesSidebar from "../components/CategoriesSidebar";
import PostsList from "../components/PostsList";
import Hero from "../components/Hero";

const CategoriesPage = () => {
    const navigate = useNavigate();
    const { slug } = useParams();
    const CATEGORY_PAGE_SIZE = 6;
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [categoryPage, setCategoryPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(false);

    const fetchCategoryBlogs = async ({ categorySlug, page = 1, append = false }) => {
        if (!categorySlug) return;

        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const res = await api.get(
                `/blogs?page=${page}&limit=${CATEGORY_PAGE_SIZE}&categorySlug=${encodeURIComponent(categorySlug)}`,
            );
            const fetched = res.data?.blogs || [];
            const totalPages = res.data?.pagination?.totalPages || 1;

            setBlogs((prev) => (append ? [...prev, ...fetched] : fetched));
            setCategoryPage(page);
            setHasMorePosts(page < totalPages);
        } catch (error) {
            console.error("Error fetching category blogs:", error);
            if (!append) setBlogs([]);
            setHasMorePosts(false);
        } finally {
            if (append) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    // Fetch categories from dedicated endpoint
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const res = await api.get("/categories");
                const fetchedCategories = res.data?.categories || [];
                const categoryList = fetchedCategories.map((cat, idx) => ({
                    id: idx + 1,
                    name: cat.name,
                    slug: cat.slug || `category-${idx + 1}`,
                    description: `Articles about ${cat.name}`,
                    postCount: Number(cat.count || 0),
                    color: ['blue', 'green', 'purple', 'orange', 'red', 'yellow'][idx % 6],
                    icon: null // We'll handle icons differently
                }));

                setCategories(categoryList);

                // Initialize category from URL slug
                if (slug && categoryList.length > 0) {
                    const categoryFromUrl = categoryList.find(cat => 
                        cat.slug === slug.toLowerCase()
                    );
                    if (categoryFromUrl) {
                        setSelectedCategory(categoryFromUrl);
                    } else if (categoryList.length > 0) {
                        setSelectedCategory(categoryList[0]);
                        navigate(`/categories/${categoryList[0].slug}`, { replace: true });
                    }
                } else if (categoryList.length > 0) {
                    setSelectedCategory(categoryList[0]);
                    navigate(`/categories/${categoryList[0].slug}`, { replace: true });
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [navigate, slug]);

    // Sync selected category with URL slug changes (for browser back/forward)
    useEffect(() => {
        if (categories.length > 0) {
            if (slug) {
                const categoryFromUrl = categories.find(cat => 
                    cat.slug === slug.toLowerCase()
                );
                if (categoryFromUrl && (!selectedCategory || selectedCategory.name !== categoryFromUrl.name)) {
                    setSelectedCategory(categoryFromUrl);
                }
            } else if (!selectedCategory) {
                setSelectedCategory(categories[0]);
            }
        }
    }, [categories, selectedCategory, slug]);

    // Handle category selection and update URL
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        if (category) {
            navigate(`/categories/${category.slug}`);
        }
    };

    // Fetch blogs by selected category with pagination
    useEffect(() => {
        if (!selectedCategory?.slug) return;
        fetchCategoryBlogs({ categorySlug: selectedCategory.slug, page: 1, append: false });
    }, [selectedCategory?.slug]);

    const handleViewMore = () => {
        if (!selectedCategory?.slug || loadingMore || !hasMorePosts) return;
        fetchCategoryBlogs({
            categorySlug: selectedCategory.slug,
            page: categoryPage + 1,
            append: true,
        });
    };

    return (
        <>
            <Hero
                title={"Blog Categories"}
                description={"Explore our curated collection of topics and discover articles that interest you."}
            />
            <main className="container">
                {loading ? (
                    <div className="text-center py-12">Loading categories...</div>
                ) : categories.length > 0 ? (
                    <div className="main-flex">
                        <CategoriesSidebar 
                            selectedCategory={selectedCategory} 
                            setSelectedCategory={handleCategoryChange}
                            categories={categories}
                        />
                        <PostsList
                            posts={blogs}
                            selectedCategory={selectedCategory}
                            onViewMore={handleViewMore}
                            hasMore={hasMorePosts}
                            loadingMore={loadingMore}
                        />
                    </div>
                ) : (
                    <div className="text-center py-12">No categories found.</div>
                )}
            </main>
        </>

    );
};

export default CategoriesPage;
