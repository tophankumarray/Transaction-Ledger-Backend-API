const express = require('express');
const transferController = require('../controllers/transferController');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { createTransferSchema } = require('../validators/transferValidator');

const router = express.Router();

/**
 * Bonus: Money Transfer Endpoint: POST /api/v1/transfers
 * Atomically transfers funds between two distinct accounts.
 */
router.post(
  '/',
  validate(createTransferSchema, 'body'),
  asyncHandler((req, res) => transferController.transferMoney(req, res))
);

module.exports = router;
