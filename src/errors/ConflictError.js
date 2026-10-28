const AppError = require('./AppError');
const { ERROR_CODES } = require('../constants/transactionTypes');

class ConflictError extends AppError {
  constructor(message = 'Resource conflict', errorCode = ERROR_CODES.DUPLICATE_REFERENCE, details = null) {
    super(message, 409, errorCode, details);
  }
}

module.exports = ConflictError;

