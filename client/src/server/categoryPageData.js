import { getServerApiBaseUrl } from "../config/runtime";

export const CATEGORY_PAGE_SIZE = 6;

const CATEGORY_COLORS = [
  "blue",
  "green",
  "purple",
  "orange",
  "red",
  "yellow",
];

const fetchJsonSafe = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  } catch (_error) {
    return null;
  }
};

export const normalizeCategories = (items = []) =>
  items
    .map((item, index) => {
      const name = String(item?.name || "").trim();
      const slug = String(item?.slug || `category-${index + 1}`).trim();

      return {
        id: index + 1,
        name,
        slug,
        description: `Articles about ${name}`,
        postCount: Number(item?.count || 0),
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        icon: null,
      };
    })
    .filter((item) => item.name);

export const fetchCategoriesData = async () => {
  const apiBase = getServerApiBaseUrl();
  const payload = await fetchJsonSafe(`${apiBase}/categories`);
  return Array.isArray(payload?.categories) ? payload.categories : [];
};

export const fetchCategoryBlogsData = async ({
  categorySlug,
  page = 1,
  limit = CATEGORY_PAGE_SIZE,
}) => {
  if (!categorySlug) {
    return {
      blogs: [],
      totalPages: 1,
      totalBlogs: 0,
    };
  }

  const apiBase = getServerApiBaseUrl();
  const payload = await fetchJsonSafe(
    `${apiBase}/blogs?page=${page}&limit=${limit}&categorySlug=${encodeURIComponent(categorySlug)}`,
  );

  const blogs = Array.isArray(payload?.blogs) ? payload.blogs : [];
  const totalPages = Number(payload?.pagination?.totalPages || 1);
  const totalBlogs = Number(payload?.pagination?.total || blogs.length || 0);

  return {
    blogs,
    totalPages,
    totalBlogs,
  };
};
