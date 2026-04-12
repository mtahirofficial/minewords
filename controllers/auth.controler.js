const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User } = require("../models"); // Sequelize model
const { AuthMiddleware } = require("../middleware");
const { MailerService } = require("../services");
const {
  generateOTP,
  randomPassword,
  getSecondBetween2Date,
} = require("../utils");
const { REGEX_EMAIL, MAX_TIME_OTP, MIN_LENGTH_PASS } = require("../constants");
const { rateLimit } = require("express-rate-limit");

const {
  ServerException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} = require("../exceptions");

const EMAIL_VERIFY_EXPIRES_HOURS = 24;
const EMAIL_RESEND_COOLDOWN_SECONDS = 60;

class AuthController {
  _path = "/auth";
  _router = express.Router();

  constructor() {
    this.initializeRoutes();
  }

  normalizeOrigin(rawOrigin = "") {
    return String(rawOrigin || "")
      .split(",")
      .map((item) => item.trim())
      .find(Boolean);
  }

  serializeUser(user) {
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      isVerified: Boolean(user.isVerified),
    };
  }

  buildEmailVerificationUrl(token = "") {
    return `${process.env.HOST.replace(/\/+$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
  }

  createEmailVerificationToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  async sendVerificationEmail(user, { isResend = false } = {}) {
    const token = this.createEmailVerificationToken();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + EMAIL_VERIFY_EXPIRES_HOURS * 60 * 60 * 1000,
    );
    const appName = process.env.APP_NAME || "MineWords";
    const verifyUrl = this.buildEmailVerificationUrl(token);

    await user.update({
      emailVerificationToken: token,
      emailVerificationExpiresAt: expiresAt,
      emailVerificationSentAt: now,
    });

    await MailerService.sendEmail({
      to: user.email,
      subject: isResend
        ? `New verification link for ${appName}`
        : `Welcome to ${appName} - Verify your email`,
      template: "verifySignup",
      context: {
        name: user.name || user.username || "there",
        appName,
        verifyUrl,
        expiryHours: EMAIL_VERIFY_EXPIRES_HOURS,
        currentYear: new Date().getFullYear(),
      },
    });
  }

  // ---------------- REGISTER ----------------
  async registerAccount(req, res, next) {
    try {
      const payload = req.body?.user || {};
      const email = String(payload.email || "")
        .trim()
        .toLowerCase();
      const password = String(payload.password || "");
      const name = String(payload.name || "").trim();

      if (!email || !REGEX_EMAIL.test(email)) {
        return next(new BadRequestException("Please provide a valid email"));
      }

      if (password.length < MIN_LENGTH_PASS) {
        return next(
          new BadRequestException(
            `Password must be at least ${MIN_LENGTH_PASS} characters`,
          ),
        );
      }

      const userExisting = await User.findOne({ where: { email } });
      if (userExisting)
        return next(new BadRequestException("User already exists"));

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        email,
        password: hashedPassword,
        name: name || email.split("@")[0],
        username: email.split("@")[0],
        isVerified: false,
      });

      await this.sendVerificationEmail(newUser);

      return res.json({
        status: 200,
        message:
          "Account created. We've sent a verification link to your email.",
        data: {
          id: newUser.id,
          email: newUser.email,
          isVerified: false,
        },
      });
    } catch (error) {
      next(new ServerException(error.message));
    }
  }

  // ---------------- LOGIN ----------------
  async login(req, res, next) {
    try {
      const email = String(req.body?.email || "")
        .trim()
        .toLowerCase();
      const password = String(req.body?.password || "");
      const user = await User.findOne({ where: { email } });
      if (!user) return next(new NotFoundException("User not found"));

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return next(new BadRequestException("Password not matching!"));
      // if (!user.active) return next(new ForbiddenException("User is temporarily locked!"));

      const payload = { id: user.id, email: user.email };

      const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });
      const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
      });

      // Save refresh token to DB
      await user.update({ refreshToken });

      // Send HttpOnly cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        status: 200,
        message: "success",
        data: {
          accessToken,
          user: this.serializeUser(user),
        },
      });
    } catch (error) {
      next(new ServerException(error.message));
    }
  }

  // ---------------- WHO AM I ----------------
  async whoAmI(req, res, next) {
    try {
      return res.json({
        status: 200,
        message: "success",
        data: this.serializeUser(req.user),
      });
    } catch (error) {
      next(new ServerException(error.message));
    }
  }

  // ---------------- VERIFY SIGNUP EMAIL ----------------
  async verifySignupEmail(req, res, next) {
    try {
      const token = String(req.query?.token || req.body?.token || "").trim();
      if (!token)
        return next(new BadRequestException("Verification token is required"));

      const user = await User.findOne({
        where: { emailVerificationToken: token },
      });
      if (!user)
        return next(
          new BadRequestException("Invalid or already used verification link"),
        );

      if (user.isVerified) {
        return res.json({
          status: 200,
          message: "Email already verified",
          data: { user: this.serializeUser(user) },
        });
      }

      const expiresAt = user.emailVerificationExpiresAt
        ? new Date(user.emailVerificationExpiresAt)
        : null;
      if (!expiresAt || expiresAt.getTime() < Date.now()) {
        await user.update({
          emailVerificationToken: null,
          emailVerificationExpiresAt: null,
        });
        return next(
          new BadRequestException(
            "Verification link expired. Please request a new link.",
          ),
        );
      }

      await user.update({
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
        emailVerificationSentAt: null,
      });

      return res.json({
        status: 200,
        message: "Email verified successfully",
        data: { user: this.serializeUser(user) },
      });
    } catch (error) {
      next(new ServerException(error.message));
    }
  }

  // ---------------- RESEND VERIFICATION EMAIL ----------------
  async resendVerificationEmail(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) return next(new NotFoundException("User not found"));

      if (user.isVerified) {
        return next(
          new BadRequestException("Your account is already verified"),
        );
      }

      const lastSentAt = user.emailVerificationSentAt
        ? new Date(user.emailVerificationSentAt)
        : null;
      if (lastSentAt) {
        const elapsedSeconds = Math.floor(
          (Date.now() - lastSentAt.getTime()) / 1000,
        );
        if (elapsedSeconds < EMAIL_RESEND_COOLDOWN_SECONDS) {
          const waitSeconds = EMAIL_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
          return next(
            new BadRequestException(
              `Please wait ${waitSeconds}s before requesting another link`,
            ),
          );
        }
      }

      await this.sendVerificationEmail(user, { isResend: true });

      return res.json({
        status: 200,
        message: "Verification email sent successfully",
      });
    } catch (error) {
      next(new ServerException(error.message));
    }
  }

  // ---------------- REFRESH TOKEN ----------------
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) return next(new UnauthorizedException());

      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
      );

      const user = await User.findByPk(decoded.id);

      if (!user) {
        return next(new NotFoundException("User not found"));
      }

      if (user.refreshToken !== refreshToken)
        return next(new UnauthorizedException());

      const payload = { id: user.id, email: user.email };
      const newAccessToken = jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" },
      );
      const newRefreshToken = jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" },
      );

      // Update refresh token in DB & cookie
      await user.update({ refreshToken: newRefreshToken });
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        status: 200,
        message: "success",
        data: { accessToken: newAccessToken },
      });
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
        context: { email, code: otp },
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
      if (user.otp !== otp || seconds > MAX_TIME_OTP)
        return next(new BadRequestException("OTP expired"));

      const newPassword = randomPassword(8);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await user.update({ password: hashedPassword, active: true, otp: null });

      await MailerService.sendEmail({
        to: email,
        subject: "Your new password",
        template: "sendNewPassword",
        context: { email, password: newPassword },
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
      legacyHeaders: false,
    });
  }

  // ---------------- INITIALIZE ROUTES ----------------
  initializeRoutes() {
    this._router.post(
      `${this._path}/register`,
      this.registerAccount.bind(this),
    );
    this._router.post(`${this._path}/login`, this.login.bind(this));
    this._router.post(
      `${this._path}/refresh-token`,
      this.refreshToken.bind(this),
    );
    this._router.get(
      `${this._path}/me`,
      AuthMiddleware,
      this.whoAmI.bind(this),
    );
    this._router.get(
      `${this._path}/verify-email`,
      this.verifySignupEmail.bind(this),
    );
    this._router.post(
      `${this._path}/resend-verification`,
      AuthMiddleware,
      this.apiLimiter(3),
      this.resendVerificationEmail.bind(this),
    );
    this._router.post(
      `${this._path}/forgot-password`,
      this.apiLimiter(1),
      this.forgotPassword.bind(this),
    );
    this._router.post(
      `${this._path}/verify-otp-forgot`,
      this.apiLimiter(5),
      this.verifyOtpForgotPassword.bind(this),
    );
  }
}

module.exports = AuthController;
