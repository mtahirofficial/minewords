import React, { useState } from "react";
import Link from "next/link";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitSuccess(true);
            setEmail("");
        }, 1500);
    };

    return (
        <main className="container">
            <div className="forgot-card">
                <h2>Forgot Password</h2>
                <p>Enter your email address below and we'll send a password reset link.</p>

                {submitSuccess && (
                    <div className="success-message">
                        Password reset link sent! Please check your email.
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            required
                        />
                    </div>

                    <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <p className="back-link">
                    Remembered your password? <Link href="/login">Login</Link>
                </p>
            </div>
        </main>
    );
};

export default ForgotPasswordPage;
