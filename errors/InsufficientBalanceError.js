import AppError from './AppError.js';
import { ERROR_CODES } from '../constants/transactionTypes.js';

export class InsufficientBalanceError extends AppError {
  constructor(message = 'Insufficient balance for this transaction', details = null) {
    super(message, 400, ERROR_CODES.INSUFFICIENT_BALANCE, details);
  }
}

export default InsufficientBalanceError;
