import { useState } from "react";
import api from "../../api";
import { showToast } from "../../toast";

const NewsletterBox = () => {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        
        if (!email.trim()) {
            showToast("Please enter your email address", "error");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast("Please enter a valid email address", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.post("/newsletter/subscribe", { email });
            
            setIsSubscribed(true);
            setEmail("");
            
            // Show appropriate message based on response
            if (res.data.alreadySubscribed) {
                showToast("You are already subscribed to our newsletter!", "info");
            } else {
                showToast("Successfully subscribed to newsletter!", "success");
            }
            
            // Reset after 3 seconds
            setTimeout(() => {
                setIsSubscribed(false);
            }, 3000);
        } catch (err) {
            console.error("Newsletter subscription failed:", err);
            const errorMessage = err.response?.data?.message || "Failed to subscribe. Please try again later.";
            showToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="newsletter-box">
            <h3>Subscribe to Newsletter</h3>
            <p>Get the latest articles in your inbox.</p>
            {isSubscribed ? (
                <div className="newsletter-success">
                    <p>✓ Thank you for subscribing!</p>
                </div>
            ) : (
                <form className="newsletter-form" onSubmit={handleSubscribe}>
                    <input 
                        type="email"
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        required
                        className="newsletter-input"
                    />
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="btn btn-primary"
                    >
                        {isSubmitting ? (<span className="newsletter-spinner"></span>) : (
                            "Subscribe"
                        )}
                    </button>
                </form>
            )}
        </div>
    );
};

export default NewsletterBox;
