import AppError from './AppError.js';
import { ERROR_CODES } from '../constants/transactionTypes.js';

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errorCode = ERROR_CODES.NOT_FOUND) {
    super(message, 404, errorCode);
  }
}

export default NotFoundError;
