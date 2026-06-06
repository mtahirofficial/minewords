import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import CategoriesSidebar from "../../src/components/CategoriesSidebar";
import PostsList from "../../src/components/PostsList";
import Hero from "../../src/components/Hero";
import {
  CATEGORY_PAGE_SIZE,
  fetchCategoriesData,
  fetchCategoryBlogsData,
  normalizeCategories,
} from "../../src/server/categoryPageData";

export async function getServerSideProps(context) {
  const slug = Array.isArray(context.params?.slug)
    ? context.params.slug[0]
    : context.params?.slug;

  const categoryRows = await fetchCategoriesData();
  const categories = normalizeCategories(categoryRows);

  if (!categories.length) {
    return {
      props: {
        initialBlogs: [],
        initialCategories: [],
        initialSelectedCategory: null,
        initialHasMorePosts: false,
      },
    };
  }

  const normalizedSlug = String(slug || "").toLowerCase();
  const selectedCategory =
    categories.find((category) => category.slug === normalizedSlug) ||
    categories[0];

  if (normalizedSlug && selectedCategory.slug !== normalizedSlug) {
    return {
      redirect: {
        destination: `/categories/${selectedCategory.slug}`,
        permanent: false,
      },
    };
  }

  const initialBlogsPayload = await fetchCategoryBlogsData({
    categorySlug: selectedCategory.slug,
    page: 1,
    limit: CATEGORY_PAGE_SIZE,
  });

  return {
    props: {
      initialBlogs: initialBlogsPayload.blogs,
      initialCategories: categories,
      initialSelectedCategory: selectedCategory,
      initialHasMorePosts: initialBlogsPayload.totalPages > 1,
    },
  };
}

const CategoriesPage = ({
  initialBlogs = [],
  initialCategories = [],
  initialSelectedCategory = null,
  initialHasMorePosts = false,
}) => {
  const router = useRouter();
  const slug = Array.isArray(router.query.slug)
    ? router.query.slug[0]
    : router.query.slug;
  const [blogs, setBlogs] = useState(initialBlogs);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    initialSelectedCategory,
  );
  const [categories, setCategories] = useState(initialCategories);
  const [categoryPage, setCategoryPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(initialHasMorePosts);
  const skipFirstBlogFetchRef = useRef(Boolean(initialSelectedCategory?.slug));

  const fetchCategoryBlogs = async ({
    categorySlug,
    page = 1,
    append = false,
  }) => {
    if (!categorySlug) return;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const payload = await fetchCategoryBlogsData({
        categorySlug,
        page,
        limit: CATEGORY_PAGE_SIZE,
      });

      setBlogs((prev) => (append ? [...prev, ...payload.blogs] : payload.blogs));
      setCategoryPage(page);
      setHasMorePosts(page < payload.totalPages);
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

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    if (!categories.length) return;

    const categoryFromUrl = slug
      ? categories.find((category) => category.slug === slug.toLowerCase())
      : categories[0];

    if (
      categoryFromUrl &&
      (!selectedCategory || selectedCategory.slug !== categoryFromUrl.slug)
    ) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [categories, selectedCategory, slug]);

  useEffect(() => {
    if (!selectedCategory?.slug) return;

    if (
      skipFirstBlogFetchRef.current &&
      selectedCategory.slug === initialSelectedCategory?.slug
    ) {
      skipFirstBlogFetchRef.current = false;
      return;
    }

    fetchCategoryBlogs({
      categorySlug: selectedCategory.slug,
      page: 1,
      append: false,
    });
    // The server already gave us the first result set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory?.slug]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category) {
      router.push(`/categories/${category.slug}`);
    }
  };

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
        description={
          "Explore our curated collection of topics and discover articles that interest you."
        }
      />
      <main className="container">
        {categories.length > 0 ? (
          <div className="main-flex">
            <CategoriesSidebar
              selectedCategory={selectedCategory}
              setSelectedCategory={handleCategoryChange}
              categories={categories}
            />
            {loading ? (
              <div className="text-center py-12">Loading categories...</div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-12">
                No articles found in this category.
              </div>
            ) : (
              <PostsList
                posts={blogs}
                selectedCategory={selectedCategory}
                onViewMore={handleViewMore}
                hasMore={hasMorePosts}
                loadingMore={loadingMore}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            {loading ? "Loading categories..." : "No categories found."}
          </div>
        )}
      </main>
    </>
  );
};

export default CategoriesPage;
