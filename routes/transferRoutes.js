import express from 'express';
import transferController from '../controllers/transferController.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createTransferSchema } from '../validators/transferValidator.js';

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

export default router;
