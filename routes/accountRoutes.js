import express from 'express';
import accountController from '../controllers/accountController.js';
import transactionController from '../controllers/transactionController.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  createAccountSchema,
  accountParamSchema,
} from '../validators/accountValidator.js';
import {
  addTransactionSchema,
  getTransactionHistoryQuerySchema,
} from '../validators/transactionValidator.js';

const router = express.Router();

// 1. Create a new account
router.post(
  '/',
  validate(createAccountSchema, 'body'),
  asyncHandler((req, res) => accountController.createAccount(req, res))
);

// 2. Get account balance
router.get(
  '/:accountId/balance',
  validate(accountParamSchema, 'params'),
  asyncHandler((req, res) => accountController.getAccountBalance(req, res))
);

// 3. Get account details
router.get(
  '/:accountId',
  validate(accountParamSchema, 'params'),
  asyncHandler((req, res) => accountController.getAccountById(req, res))
);

// 4. Add transaction to account (nested REST endpoint)
router.post(
  '/:accountId/transactions',
  validate(accountParamSchema, 'params'),
  validate(addTransactionSchema, 'body'),
  asyncHandler((req, res) => transactionController.addTransaction(req, res))
);

// 5. Get transaction history for account
router.get(
  '/:accountId/transactions',
  validate(accountParamSchema, 'params'),
  validate(getTransactionHistoryQuerySchema, 'query'),
  asyncHandler((req, res) => transactionController.getTransactionHistory(req, res))
);

export default router;
