import express from 'express';
import transactionController from '../controllers/transactionController.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { addTransactionSchema } from '../validators/transactionValidator.js';
import { BadRequestError } from '../errors/index.js';
import { ERROR_CODES } from '../constants/transactionTypes.js';

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

export default router;
