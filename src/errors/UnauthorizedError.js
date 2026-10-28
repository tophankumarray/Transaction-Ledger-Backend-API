const AppError = require('./AppError');
const { ERROR_CODES } = require('../constants/transactionTypes');

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', errorCode = ERROR_CODES.UNAUTHORIZED, details = null) {
    super(message, 401, errorCode, details);
  }
}

module.exports = UnauthorizedError;
