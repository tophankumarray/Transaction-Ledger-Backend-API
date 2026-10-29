import AppError from './AppError.js';
import { ERROR_CODES } from '../constants/transactionTypes.js';

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export default ValidationError;
