const AuthMiddleware = require("./auth.middleware");
const VerifiedMiddleware = require("./verified.middleware");
const LoggerMiddleware = require("./logger.middleware");
const ErrorsMiddleware = require("./errors.middleware");

module.exports = {
	AuthMiddleware,
	VerifiedMiddleware,
	LoggerMiddleware,
	ErrorsMiddleware
};
