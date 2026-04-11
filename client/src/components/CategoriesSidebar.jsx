import React, { useState } from "react";

const CategoriesSidebar = ({ selectedCategory, setSelectedCategory, categories = [] }) => {


    return (
        <div className="categories-sidebar">
            <div className="categories-list">
                <h2 className="categories-title">Browse Categories</h2>
                {categories.map((category) => {
                    const IconComponent = category.icon;

                    return <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category)}
                        className={`category-card ${selectedCategory?.id === category.id ? "selected" : ""
                            }`}
                    >
                        <div className="category-content">
                            <div className={`category-icon ${category.color}`}>
                                {/* <IconComponent className="icon" /> */}
                            </div>
                            <div className="category-info">
                                <h3 className="category-name">{category.name}</h3>
                                <p className="category-description">{category.description}</p>
                                <div className="category-meta">
                                    <span>{category.postCount} articles</span>
                                </div>
                            </div>
                            <span className={`category-color ${category.color}`}></span>
                        </div>
                    </button>
                })}
            </div>

            <div className="category-stats">
                <h3>Category Stats</h3>
                <div className="stat-item">
                    <span>Total Categories</span>
                    <span>{categories.length}</span>
                </div>
                <div className="stat-item">
                    <span>Total Articles</span>
                    <span>{categories.reduce((sum, cat) => sum + cat.postCount, 0)}</span>
                </div>
                <div className="stat-item">
                    <span>Most Popular</span>
                    <span>
                        {categories.reduce((max, cat) => (cat.postCount > max.postCount ? cat : max))
                            .name}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CategoriesSidebar;
