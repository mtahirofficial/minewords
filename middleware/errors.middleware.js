function ErrorsMiddleware(exception, request, response, next) {
  const status = exception.status || (exception.name === "MulterError" ? 400 : 500);
  const message = exception.message || "Server Internal Error";
  const errors = exception.errors || null;

  response.status(status).send({
    status,
    message,
    errors,
  });
}

module.exports = ErrorsMiddleware;
