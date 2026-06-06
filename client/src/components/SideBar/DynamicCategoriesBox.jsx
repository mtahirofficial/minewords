import Link from "next/link";

const DynamicCategoriesBox = ({ categories = [] }) => (
  <div className="categories-box">
    <h3>Popular Categories</h3>
    <div className="categories-list">
      {categories.length > 0 ? (
        categories.slice(0, 5).map((category) => (
          <Link
            key={category.name}
            href={`/categories/${category.slug}`}
            className="category-row"
          >
            <span>{category.name}</span>
            <span>{category.count}</span>
          </Link>
        ))
      ) : (
        <div className="category-row">
          <span>No categories yet</span>
          <span>0</span>
        </div>
      )}
    </div>
  </div>
);

export default DynamicCategoriesBox;
