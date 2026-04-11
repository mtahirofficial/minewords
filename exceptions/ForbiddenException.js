const HttpException = require('./HttpException');

class ForbiddenException extends HttpException {
  constructor(message) {
    super(message || 'Refuses to authorize', 403);
  }
}

module.exports = ForbiddenException;
