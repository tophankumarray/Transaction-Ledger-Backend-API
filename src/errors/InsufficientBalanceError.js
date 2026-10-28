const AppError = require('./AppError');
const { ERROR_CODES } = require('../constants/transactionTypes');

class InsufficientBalanceError extends AppError {
  constructor(message = 'Insufficient balance for this transaction', details = null) {
    // 400 or 422 - we use 400 Bad Request / Unprocessable with explicit error code
    super(message, 400, ERROR_CODES.INSUFFICIENT_BALANCE, details);
  }
}

module.exports = InsufficientBalanceError;

