const DynamicCategoriesBox = ({ categories = [] }) => (
    <div className="categories-box">
        <h3>Popular Categories</h3>
        <div className="categories-list">
            {categories.length > 0 ? (
                categories.slice(0, 5).map((category) => (
                    <div key={category.name} className="category-row">
                        <span>{category.name}</span>
                        <span>{category.count}</span>
                    </div>
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
