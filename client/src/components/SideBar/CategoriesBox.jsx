const CategoriesBox = () => (
    <div className="categories-box">
        <h3>Popular Categories</h3>
        <div className="categories-list">
            {["React", "JavaScript", "CSS", "Node.js", "TypeScript"].map((cat) => (
                <div key={cat} className="category-row">
                    <span>{cat}</span>
                    <span>12</span>
                </div>
            ))}
        </div>
    </div>

);

export default CategoriesBox;
