import React from 'react'

const Pagination = ({ page, setPage, totalPages }) => {

    // Calculate 3 center buttons
    const getPageNumbers = () => {
        if (totalPages <= 3) return [...Array(totalPages)].map((_, i) => i + 1);

        if (page === 1) return [1, 2, 3];
        if (page === totalPages) return [totalPages - 2, totalPages - 1, totalPages];

        return [page - 1, page, page + 1];
    };


    return (
        <div className="pagination">
            <button className="btn btn-primary previous" disabled={page === 1}
                onClick={() => setPage(page - 1)}>Previous</button>
            {getPageNumbers().map((num) => (
                <button
                    key={num}
                    className={`btn btn-secondary page ${page === num ? "active" : ""}`}
                    onClick={() => setPage(num)}
                >
                    {num}
                </button>
            ))}
            <button className="btn btn-secondary next" disabled={page === totalPages}
                onClick={() => setPage(page + 1)}>Next</button>
        </div>

    )
}

export default Pagination