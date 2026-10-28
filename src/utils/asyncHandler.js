/**
 * Higher-order function that catches any rejected promise from an async express handler
 * and forwards it to the next() error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
