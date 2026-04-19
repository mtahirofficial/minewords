import React, { useState } from "react";
import ContactInfo from "../src/components/ContactInfo";
import SocialMedia from "../src/components/SocialMedia";
import ContactForm from "../src/components/ContactForm";
import FAQ from "../src/components/FAQ";
import Hero from "../src/components/Hero";
import api from "../src/api";
import { showToast } from "../src/toast";

const ContactPage = () => {
    const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
            showToast("Please fill in all fields", "error");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showToast("Please enter a valid email address", "error");
            return;
        }

        setIsSubmitting(true);
        setSubmitSuccess(false);
        
        try {
            const res = await api.post("/contact/submit", {
                name: formData.name.trim(),
                email: formData.email.trim(),
                subject: formData.subject.trim(),
                message: formData.message.trim()
            });
            
            setSubmitSuccess(true);
            setFormData({ name: "", email: "", subject: "", message: "" });
            showToast("Message sent successfully! We'll get back to you soon.", "success");
        } catch (err) {
            console.error("Contact form submission failed:", err);
            const errorMessage = err.response?.data?.message || "Failed to send message. Please try again later.";
            showToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Hero
                title={"Contact Us"}
                description={"Have questions, feedback, or want to collaborate? We'd love to hear from you!"}
            />
            <main className="container">
                <div className="contact-flex">
                    <div className="contact-sidebar">
                        <ContactInfo />
                        <SocialMedia />
                    </div>

                    <div className="contact-content">
                        <ContactForm
                            formData={formData}
                            handleInputChange={handleInputChange}
                            handleSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            submitSuccess={submitSuccess}
                        />
                    </div>
                </div>

                <FAQ />
            </main>
        </>
    );
};

export default ContactPage;
