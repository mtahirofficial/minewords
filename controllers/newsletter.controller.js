const express = require("express");
const { Newsletter } = require("../models");
const { MailerService } = require("../services");
const { ServerException, BadRequestException } = require("../exceptions");
const { rateLimit } = require("express-rate-limit");
const { Op } = require("sequelize");

class NewsletterController {
    _path = "/newsletter";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    async subscribe(req, res, next) {
        try {
            const { email } = req.body;

            if (!email || !email.trim()) {
                return next(new BadRequestException("Email is required"));
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return next(new BadRequestException("Invalid email format"));
            }

            const normalizedEmail = email.trim().toLowerCase();

            // Check if already subscribed
            const existing = await Newsletter.findOne({
                where: { email: normalizedEmail }
            });

            if (existing) {
                if (existing.subscribed) {
                    return res.json({
                        status: 200,
                        message: "You are already subscribed to our newsletter",
                        alreadySubscribed: true
                    });
                } else {
                    // Re-subscribe
                    await existing.update({ subscribed: true });
                }
            } else {
                // Create new subscription
                await Newsletter.create({
                    email: normalizedEmail,
                    subscribed: true
                });
            }

            // Send confirmation email to subscriber
            try {
                const sentEmail = await MailerService.sendEmail({
                    to: normalizedEmail,
                    subject: "Welcome to our Newsletter!",
                    template: "notification",
                    context: {
                        name: normalizedEmail.split("@")[0],
                        message: "Thank you for subscribing to our newsletter! You'll receive the latest articles and updates in your inbox."
                    }
                });
                console.log(sentEmail);
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
                // Don't fail the subscription if email fails
            }

            // Send notification to admin (optional)
            try {
                const adminEmail = process.env.CONTACT_EMAIL || process.env.MAILER_USER;
                if (adminEmail) {
                    await MailerService.sendEmail({
                        to: adminEmail,
                        subject: "New Newsletter Subscription",
                        template: "feedback",
                        context: {
                            name: "Newsletter System",
                            email: normalizedEmail,
                            subject: "New Newsletter Subscription",
                            message: `A new user has subscribed to the newsletter: ${normalizedEmail}`
                        }
                    });
                }
            } catch (emailError) {
                console.error("Failed to send admin notification:", emailError);
                // Don't fail the subscription if admin email fails
            }

            return res.json({
                status: 200,
                message: "Successfully subscribed to newsletter!",
                email: normalizedEmail
            });
        } catch (error) {
            // Handle unique constraint violation (duplicate email)
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.json({
                    status: 200,
                    message: "You are already subscribed to our newsletter",
                    alreadySubscribed: true
                });
            }
            next(new ServerException(error.message));
        }
    }

    async unsubscribe(req, res, next) {
        try {
            const { email } = req.body;

            if (!email || !email.trim()) {
                return next(new BadRequestException("Email is required"));
            }

            const normalizedEmail = email.trim().toLowerCase();

            const subscription = await Newsletter.findOne({
                where: { email: normalizedEmail }
            });

            if (!subscription) {
                return next(new BadRequestException("Email not found in our newsletter list"));
            }

            await subscription.update({ subscribed: false });

            return res.json({
                status: 200,
                message: "Successfully unsubscribed from newsletter"
            });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    apiLimiter(max = 5) {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max,
            standardHeaders: true,
            legacyHeaders: false,
            message: "Too many subscription attempts, please try again later"
        });
    }

    initializeRoutes() {
        this._router.post(
            `${this._path}/subscribe`,
            this.apiLimiter(5),
            this.subscribe.bind(this)
        );
        this._router.post(
            `${this._path}/unsubscribe`,
            this.apiLimiter(5),
            this.unsubscribe.bind(this)
        );
    }
}

module.exports = NewsletterController;

