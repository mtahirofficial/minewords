const express = require("express");
const { MailerService } = require("../services");
const { ServerException, BadRequestException } = require("../exceptions");
const { rateLimit } = require("express-rate-limit");
const { Contact } = require("../models");

class ContactController {
    _path = "/contact";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    async submitContact(req, res, next) {
        try {
            const { name, email, subject, message } = req.body;

            // Validate required fields
            if (!name || !email || !subject || !message) {
                return next(new BadRequestException("All fields are required"));
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return next(new BadRequestException("Invalid email format"));
            }

            // Save contact submission to database
            const contact = await Contact.create({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                subject: subject.trim(),
                message: message.trim(),
                status: 'new'
            });

            // Send email notification to admin
            try {
                await MailerService.sendEmail({
                    to: process.env.CONTACT_EMAIL || process.env.MAILER_USER,
                    subject: `Contact Form: ${subject}`,
                    template: "feedback", // Using existing feedback template
                    context: {
                        name,
                        email,
                        subject,
                        message,
                    }
                });
            } catch (emailError) {
                console.error("Failed to send admin notification email:", emailError);
                // Don't fail the request if email fails, contact is already saved
            }

            // Send confirmation email to user
            try {
                await MailerService.sendEmail({
                    to: email,
                    subject: "Thank you for contacting us",
                    template: "notification",
                    context: {
                        name,
                        message: "We have received your message and will get back to you soon."
                    }
                });
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
                // Don't fail the request if email fails, contact is already saved
            }

            return res.json({
                status: 200,
                message: "Contact form submitted successfully",
                contactId: contact.id
            });
        } catch (error) {
            console.error("Contact submission error:", error);
            next(new ServerException(error.message));
        }
    }

    apiLimiter(max = 5) {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max,
            standardHeaders: true,
            legacyHeaders: false
        });
    }

    initializeRoutes() {
        this._router.post(
            `${this._path}/submit`,
            this.apiLimiter(5),
            this.submitContact.bind(this)
        );
    }
}

module.exports = ContactController;

