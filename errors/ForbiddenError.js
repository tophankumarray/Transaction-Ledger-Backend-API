import AppError from './AppError.js';
import { ERROR_CODES } from '../constants/transactionTypes.js';

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', errorCode = ERROR_CODES.FORBIDDEN, details = null) {
    super(message, 403, errorCode, details);
  }
}

export default ForbiddenError;
