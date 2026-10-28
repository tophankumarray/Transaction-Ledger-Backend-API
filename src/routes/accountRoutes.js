const express = require('express');
const accountController = require('../controllers/accountController');
const transactionController = require('../controllers/transactionController');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const {
  createAccountSchema,
  accountParamSchema,
} = require('../validators/accountValidator');
const {
  addTransactionSchema,
  getTransactionHistoryQuerySchema,
} = require('../validators/transactionValidator');

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

module.exports = router;
