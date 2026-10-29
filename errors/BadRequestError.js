import AppError from './AppError.js';

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errorCode = 'BAD_REQUEST', details = null) {
    super(message, 400, errorCode, details);
  }
}

export default BadRequestError;
