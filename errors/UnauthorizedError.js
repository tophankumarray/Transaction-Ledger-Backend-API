import AppError from './AppError.js';
import { ERROR_CODES } from '../constants/transactionTypes.js';

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', errorCode = ERROR_CODES.UNAUTHORIZED, details = null) {
    super(message, 401, errorCode, details);
  }
}

export default UnauthorizedError;
