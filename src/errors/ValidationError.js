const AppError = require('./AppError');
const { ERROR_CODES } = require('../constants/transactionTypes');

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

module.exports = ValidationError;
