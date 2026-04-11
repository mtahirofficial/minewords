import React from "react";
import BlogCard from "./BlogCard";
import Pagination from "./Pagination";

const BlogList = ({ posts, paginate = true }) => (
    <div className="blog-list">
        {posts.map((p) => (
            <BlogCard key={p.id} post={p} />
        ))}
        {paginate && <Pagination />}
    </div>

);

export default BlogList;
