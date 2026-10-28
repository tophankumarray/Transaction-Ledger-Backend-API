const AppError = require('./AppError');
const { ERROR_CODES } = require('../constants/transactionTypes');

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errorCode = ERROR_CODES.NOT_FOUND) {
    super(message, 404, errorCode);
  }
}

module.exports = NotFoundError;

