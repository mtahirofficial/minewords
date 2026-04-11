import React from "react";
import BlogList from "./BlogList";

const PostsList = ({
    posts,
    selectedCategory,
    onViewMore,
    hasMore = false,
    loadingMore = false,
}) => {
    return (
        <div className="postlist-content">
            <div className="postlist-header">
                <div className={`postlist-icon-large ${selectedCategory.color}`}>
                    {/* <selectedCategory.icon className="postlist-icon-svg" /> */}
                </div>
                <div>
                    <h2 className="postlist-title">{selectedCategory.name}</h2>
                    <p className="postlist-description">{selectedCategory.description}</p>
                </div>
            </div>

            <div className="postlist-meta">
                <span>{selectedCategory.postCount} articles</span>
                <span>•</span>
                <span>Updated daily</span>
                <span>•</span>
                <span>Expert authors</span>
            </div>

            <div className="post-list">
                <BlogList posts={posts} paginate={false} />
            </div>

            {/* Empty State for categories without posts */}
            {posts.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        {/* <Code className="h-8 w-8 text-gray-400" /> */}
                    </div>
                    <h3 className="empty-state-title">No articles yet</h3>
                    <p className="empty-state-description">
                        We're working on creating amazing content for this category. Check back soon!
                    </p>
                    <button className="btn btn-primary">Notify me when available</button>
                </div>
            )}

            {/* View More Button */}
            {hasMore && (
                <div className="view-all-container">
                    <button
                        className="btn btn-secondary"
                        onClick={onViewMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? "Loading..." : "View More"}
                    </button>
                </div>
            )}

        </div>


    );
};

export default PostsList;
