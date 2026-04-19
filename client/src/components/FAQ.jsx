import React, { useState } from "react";

export const FAQ_ITEMS = [
  {
    question: "How long does it take to get a response?",
    answer:
      "We typically respond to all inquiries within 24 business hours. During weekends and holidays, response times may be slightly longer.",
  },
  {
    question: "Do you accept guest posts?",
    answer:
      "Yes. We welcome guest contributions from experienced writers and content creators. Please include 'Guest Post Inquiry' in your subject line when contacting us.",
  },
  {
    question: "Can I report a bug or issue?",
    answer:
      "Absolutely. If you encounter bugs, broken links, or technical issues on our website, let us know with as much detail as possible.",
  },
  {
    question: "Do you offer consulting services?",
    answer:
      "We occasionally take on consulting projects and collaborations. Contact us to discuss your needs and how we can help.",
  },
];

const FAQ = ({ title = "Frequently Asked Questions", showTitle = true }) => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleItem = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <section className="faq-section">
      {showTitle && <h2>{title}</h2>}
      <ul className="faq-accordion" aria-label="Frequently asked questions">
        {FAQ_ITEMS.map((faq, index) => {
          const panelId = `faq-panel-${index}`;
          const buttonId = `faq-button-${index}`;
          const isOpen = openIndex === index;

          return (
            <li key={panelId} className={`faq-item${isOpen ? " open" : ""}`}>
              <button
                id={buttonId}
                type="button"
                className="faq-question"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(index)}
              >
                <span>{faq.question}</span>
                <span className="faq-icon" aria-hidden="true">
                  {isOpen ? "-" : "+"}
                </span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="faq-answer"
                hidden={!isOpen}
              >
                <p>{faq.answer}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default FAQ;
