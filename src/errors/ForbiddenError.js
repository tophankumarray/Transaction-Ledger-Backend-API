const AppError = require('./AppError');
const { ERROR_CODES } = require('../constants/transactionTypes');

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', errorCode = ERROR_CODES.FORBIDDEN, details = null) {
    super(message, 403, errorCode, details);
  }
}

module.exports = ForbiddenError;
