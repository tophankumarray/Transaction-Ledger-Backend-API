const express = require('express');
const transactionController = require('../controllers/transactionController');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { addTransactionSchema } = require('../validators/transactionValidator');
const { BadRequestError } = require('../errors');
const { ERROR_CODES } = require('../constants/transactionTypes');

const router = express.Router();

/**
 * Direct transaction endpoint: POST /api/v1/transactions
 * Accepts account_id in the body.
 */
router.post(
  '/',
  validate(addTransactionSchema, 'body'),
  (req, res, next) => {
    if (!req.body.account_id) {
      return next(
        new BadRequestError(
          'account_id is required in request body when calling direct /transactions endpoint',
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }
    next();
  },
  asyncHandler((req, res) => transactionController.addTransaction(req, res))
);

module.exports = router;
