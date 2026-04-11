import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <main className="container">
            <div className="notfound-card">
                <h1 className="notfound-title">404</h1>
                <h2 className="notfound-subtitle">Page Not Found</h2>
                <p className="notfound-text">
                    The page you're looking for doesn’t exist or may have been moved.
                </p>

                <Link to="/" className="btn btn-primary notfound-button">
                    Go Back Home
                </Link>
            </div>
        </main>
    );
}
