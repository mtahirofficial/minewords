const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { UnauthorizedException } = require("../exceptions");

async function AuthMiddleware(req, res, next) {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers["authorization"];
    if (!authHeader) return next(new UnauthorizedException("Access token missing"));

    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) return next(new UnauthorizedException("Access token missing"));

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded) return next(new UnauthorizedException("Invalid token"));

    // 3. Find user in database
    const user = await User.findByPk(decoded.id);
    if (!user) return next(new UnauthorizedException("User not found"));

    // 4. Attach user to request
    req.user = user;

    next();
  } catch (error) {
    // Token expired or invalid
    return next(new UnauthorizedException("Unauthorized: " + error.message));
  }
}

module.exports = AuthMiddleware;
