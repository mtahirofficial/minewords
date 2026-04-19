import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import api from "../../src/api";
import CategoriesSidebar from "../../src/components/CategoriesSidebar";
import PostsList from "../../src/components/PostsList";
import Hero from "../../src/components/Hero";

const CategoriesPage = () => {
    const router = useRouter();
    const slug = Array.isArray(router.query.slug) ? router.query.slug[0] : router.query.slug;
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
        if (!router.isReady) return;

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
                        router.replace(`/categories/${categoryList[0].slug}`);
                    }
                } else if (categoryList.length > 0) {
                    setSelectedCategory(categoryList[0]);
                    router.replace(`/categories/${categoryList[0].slug}`);
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [router, router.isReady, slug]);

    // Sync selected category with URL slug changes (for browser back/forward)
    useEffect(() => {
        if (!router.isReady) return;

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
    }, [categories, router.isReady, selectedCategory, slug]);

    // Handle category selection and update URL
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        if (category) {
            router.push(`/categories/${category.slug}`);
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
