const { ForbiddenException } = require("../exceptions");

function VerifiedMiddleware(req, res, next) {
  if (!req.user?.isVerified) {
    return next(
      new ForbiddenException(
        "Please verify your email address to create and interact with blogs",
      ),
    );
  }

  return next();
}

module.exports = VerifiedMiddleware;
