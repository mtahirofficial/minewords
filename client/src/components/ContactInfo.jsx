import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";

const ContactInfo = () => (
  <div className="contact-card">
    <h2>Get in Touch</h2>
    <div className="space-y-6">
      {/* Email */}
      <div className="contact-item">
        <div className="contact-icon email">
          <Mail className="h-6 w-6" />
        </div>
        <div className="contact-details">
          <h3>Email</h3>
          <p>info@minewords.com</p>
          <p className="small">We typically respond within 24 hours</p>
        </div>
      </div>

      {/* Phone */}
      <div className="contact-item">
        <div className="contact-icon phone">
          <Phone className="h-6 w-6" />
        </div>
        <div className="contact-details">
          <h3>Phone</h3>
          <p>+923078185388</p>
          <p className="small">Monday-Friday, 9AM-5PM PST</p>
        </div>
      </div>

      {/* Office */}
      <div className="contact-item">
        <div className="contact-icon office">
          <MapPin className="h-6 w-6" />
        </div>
        <div className="contact-details">
          <h3>Office</h3>
          <p>Office 12, Gulberg III</p>
          <p>Lahore, Punjab 54660, Pakistan</p>
        </div>
      </div>
    </div>
  </div>
);

export default ContactInfo;
