import AppError from './AppError.js';
import { ERROR_CODES } from '../constants/transactionTypes.js';

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', errorCode = ERROR_CODES.DUPLICATE_REFERENCE, details = null) {
    super(message, 409, errorCode, details);
  }
}

export default ConflictError;
