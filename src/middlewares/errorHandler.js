const { AppError } = require('../errors');
const { ERROR_CODES } = require('../constants/transactionTypes');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let error = err;

  // Handle JSON parse syntax error from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid JSON payload in request body',
      },
    });
  }

  // Handle MongoDB duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    let message = `Duplicate value detected for ${field}.`;

    if (err.keyPattern && err.keyPattern.reference_id) {
      message = 'A transaction with this reference_id already exists for this account.';
    }

    return res.status(409).json({
      success: false,
      error: {
        code: ERROR_CODES.DUPLICATE_REFERENCE,
        message,
        details: err.keyValue,
      },
    });
  }

  // Handle Mongoose CastError (e.g., invalid ObjectId/type)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: `Invalid value for parameter '${err.path}'`,
      },
    });
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError' && !(err instanceof AppError)) {
    const details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Database schema validation failed',
        details,
      },
    });
  }

  // If operational custom AppError
  if (error instanceof AppError || error.isOperational) {
    const responsePayload = {
      success: false,
      error: {
        code: error.errorCode || 'APPLICATION_ERROR',
        message: error.message,
      },
    };

    if (error.details) {
      responsePayload.error.details = error.details;
    }

    return res.status(error.statusCode || 500).json(responsePayload);
  }

  // Unhandled / programmer / 500 errors
  console.error('[UNHANDLED ERROR]:', err);

  return res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'An internal server error occurred',
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
};

module.exports = errorHandler;
