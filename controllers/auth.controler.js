const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models"); // Sequelize model
const { AuthMiddleware } = require("../middleware");
const { MailerService } = require("../services");
const { generateOTP, randomPassword, getSecondBetween2Date } = require("../utils");
const { REGEX_EMAIL, MAX_TIME_OTP, MIN_LENGTH_PASS } = require("../constants");
const { rateLimit } = require("express-rate-limit");

const {
    ServerException,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
} = require("../exceptions");

class AuthController {
    _path = "/auth";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    // ---------------- REGISTER ----------------
    async registerAccount(req, res, next) {
        try {
            const { email, password, name } = req.body.user;
            console.log(req.body.user);

            const userExisting = await User.findOne({ where: { email } });
            if (userExisting) return next(new BadRequestException("User already exists"));

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await User.create({
                email,
                password: hashedPassword,
                name,
                username: email.split("@")[0],
                active: true,
            });

            return res.json({ status: 200, message: "success", data: { id: newUser.id, email: newUser.email } });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    // ---------------- LOGIN ----------------
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            console.log(req.body)
            const user = await User.findOne({ where: { email } });
            if (!user) return next(new NotFoundException("User not found"));

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return next(new BadRequestException("Password not matching!"));
            // if (!user.active) return next(new ForbiddenException("User is temporarily locked!"));

            const payload = { id: user.id, email: user.email };

            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
            const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

            // Save refresh token to DB
            await user.update({ refreshToken });

            // Send HttpOnly cookie
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.json({ status: 200, message: "success", data: { 
                accessToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    isVerified: user.isVerified,
                }
            } });
        } catch (error) {
            console.log("error.message", error.message);

            next(new ServerException(error.message));
        }
    }

    // ---------------- WHO AM I ----------------
    async whoAmI(req, res, next) {
        try {
            return res.json({ status: 200, message: "success", data: req.user });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    // ---------------- REFRESH TOKEN ----------------
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) return next(new UnauthorizedException());

            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = await User.findByPk(decoded.id);
            if (!user || user.refreshToken !== refreshToken) return next(new UnauthorizedException());

            const payload = { id: user.id, email: user.email };
            const newAccessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
            const newRefreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

            // Update refresh token in DB & cookie
            await user.update({ refreshToken: newRefreshToken });
            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.json({ status: 200, message: "success", data: { accessToken: newAccessToken } });
        } catch (error) {
            next(new UnauthorizedException());
        }
    }

    // ---------------- FORGOT PASSWORD ----------------
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ where: { email } });
            if (!user) return next(new NotFoundException("User not found"));

            const otp = generateOTP(6);
            await user.update({ otp, active: false });

            await MailerService.sendEmail({
                to: email,
                subject: "Verify OTP to reset password",
                template: "verifyResetPassword",
                context: { email, code: otp }
            });

            return res.json({ status: 200, message: "OTP sent successfully" });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    // ---------------- VERIFY OTP & RESET PASSWORD ----------------
    async verifyOtpForgotPassword(req, res, next) {
        try {
            const { email, otp } = req.body;
            const user = await User.findOne({ where: { email } });
            if (!user) return next(new NotFoundException("User not found"));

            const seconds = getSecondBetween2Date(user.updatedAt, new Date());
            if (user.otp !== otp || seconds > MAX_TIME_OTP) return next(new BadRequestException("OTP expired"));

            const newPassword = randomPassword(8);
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await user.update({ password: hashedPassword, active: true, otp: null });

            await MailerService.sendEmail({
                to: email,
                subject: "Your new password",
                template: "sendNewPassword",
                context: { email, password: newPassword }
            });

            return res.json({ status: 200, message: "Password reset successfully" });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    // ---------------- RATE LIMITER ----------------
    apiLimiter(max = 100) {
        return rateLimit({
            windowMs: 3 * 60 * 1000,
            max,
            standardHeaders: true,
            legacyHeaders: false
        });
    }

    // ---------------- INITIALIZE ROUTES ----------------
    initializeRoutes() {
        this._router.post(`${this._path}/register`, this.registerAccount.bind(this));
        this._router.post(`${this._path}/login`, this.login.bind(this));
        this._router.post(`${this._path}/refresh-token`, this.refreshToken.bind(this));
        this._router.get(`${this._path}/me`, AuthMiddleware, this.whoAmI.bind(this));
        this._router.post(`${this._path}/forgot-password`, this.apiLimiter(1), this.forgotPassword.bind(this));
        this._router.post(`${this._path}/verify-otp-forgot`, this.apiLimiter(5), this.verifyOtpForgotPassword.bind(this));
    }
}

module.exports = AuthController;
