import React from "react";

const FAQ = () => {
    const faqs = [
        {
            question: "How long does it take to get a response?",
            answer: "We typically respond to all inquiries within 24 business hours. During weekends and holidays, response times may be slightly longer."
        },
        {
            question: "Do you accept guest posts?",
            answer: "Yes! We welcome guest contributions from experienced writers and content creators. Please include 'Guest Post Inquiry' in your subject line when contacting us."
        },
        {
            question: "Can I report a bug or issue?",
            answer: "Absolutely! If you encounter any bugs, broken links, or technical issues on our website, please let us know with as much detail as possible about the problem."
        },
        {
            question: "Do you offer consulting services?",
            answer: "We occasionally take on consulting projects and collaborations. Contact us to discuss your needs and how we can help."
        }
    ];

    return (
        <div className="faq-section">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-grid">
                {faqs.map((faq, i) => (
                    <div key={i} className="faq-card">
                        <h3>{faq.question}</h3>
                        <p>{faq.answer}</p>
                    </div>
                ))}
            </div>
        </div>

    );
};

export default FAQ;
