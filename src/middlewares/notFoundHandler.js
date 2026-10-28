const { ERROR_CODES } = require('../constants/transactionTypes');

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    },
  });
};

module.exports = notFoundHandler;

