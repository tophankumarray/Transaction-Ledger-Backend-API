import { ERROR_CODES } from '../constants/transactionTypes.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    },
  });
};

export default notFoundHandler;
