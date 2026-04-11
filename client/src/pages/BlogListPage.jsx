import { BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import BlogCard from "../components/BlogCard";
import api from "../api";
import { loadBlogs } from "../helper";
import BlogCardSkeleton from "../components/BlogCardSkeleton";
import Pagination from "../components/Pagination";

const BlogListPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(9);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadBlogs({ page, limit, search: searchTerm, setBlogs, setLoading, setTotalPages });
    }, [page, limit, searchTerm]);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">All Blogs</h1>
                <div className="relative max-w-md">
                    <input
                        type="text"
                        placeholder="Search blogs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <BlogCardSkeleton />
                    <BlogCardSkeleton />
                    <BlogCardSkeleton />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((blog) => (
                            <BlogCard key={blog.id} post={blog} />
                        ))}
                    </div>

                    {blogs.length === 0 && (
                        <div className="text-center py-12">
                            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-900 mb-2">No blogs found</h3>
                            <p className="text-gray-600">Try adjusting your search terms.</p>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination page={page} setPage={setPage} totalPages={totalPages} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
export default BlogListPage