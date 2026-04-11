const jwt = require("jsonwebtoken");
const { User } = require("../models");

async function OptionalAuthMiddleware(req, res, next) {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers["authorization"];
    
    // If no auth header, continue without user (optional auth)
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) {
      req.user = null;
      return next();
    }

    // 2. Verify token (don't throw if invalid, just set user to null)
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if (decoded) {
        // 3. Find user in database
        const user = await User.findByPk(decoded.id);
        if (user) {
          req.user = user;
        } else {
          req.user = null;
        }
      } else {
        req.user = null;
      }
    } catch (error) {
      // Token expired or invalid - just continue without user
      req.user = null;
    }

    next();
  } catch (error) {
    // On any error, continue without user
    req.user = null;
    next();
  }
}

module.exports = OptionalAuthMiddleware;

