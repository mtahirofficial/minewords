import React from "react";
import { User, Mail, MessageSquare, Send } from "lucide-react";

const ContactForm = ({
    formData,
    handleInputChange,
    handleSubmit,
    isSubmitting,
    submitSuccess
}) => (
    <div className="contact-form-card">
        <h2>Send us a Message</h2>
        <p>
            Fill out the form below and we'll get back to you as soon as possible.
        </p>

        {submitSuccess && (
            <div className="contact-success">
                <svg
                    className="contact-success-icon"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
                Message sent successfully! We'll get back to you soon.
            </div>
        )}

        <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-grid">
                {/* Name */}
                <div>
                    <label htmlFor="name">Full Name</label>
                    <div className="relative">
                        <User className="input-icon" />
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="contact-input"
                            placeholder="Your full name"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email">Email Address</label>
                    <div className="relative">
                        <Mail className="input-icon" />
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="contact-input"
                            placeholder="your.email@example.com"
                        />
                    </div>
                </div>
            </div>

            {/* Subject */}
            <div>
                <label htmlFor="subject">Subject</label>
                <div className="relative">
                    <MessageSquare className="input-icon" />
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="contact-input"
                        placeholder="What is this regarding?"
                    />
                </div>
            </div>

            {/* Message */}
            <div>
                <label htmlFor="message">Message</label>
                <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="contact-textarea"
                    placeholder="Please share your message, question, or feedback..."
                />
            </div>

            {/* Submit */}
            <div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-success"
                >
                    {isSubmitting ? (
                        <>
                            <svg
                                className="contact-loading-spinner"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="spinner-circle"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="spinner-path"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="contact-send-icon" />
                            Send Message
                        </>
                    )}
                </button>
            </div>

            {/* Response Time */}
            <div className="response-time-card">
                <h3>Response Time</h3>
                <p>
                    We strive to respond to all inquiries within 24 business hours. For
                    urgent matters, please call us directly during business hours.
                </p>
            </div>
        </form>
    </div>

);

export default ContactForm;
