import { z } from 'zod';
import { TRANSACTION_TYPES } from '../constants/transactionTypes.js';
import { hasAtMostTwoDecimals } from '../utils/math.js';

export const addTransactionSchema = z.object({
  account_id: z
    .string({
      invalid_type_error: 'account_id must be a string',
    })
    .trim()
    .min(1, 'account_id cannot be empty')
    .optional(), // Can come from URL parameter or request body
  type: z.enum([TRANSACTION_TYPES.CREDIT, TRANSACTION_TYPES.DEBIT], {
    errorMap: () => ({
      message: `Transaction type must be either '${TRANSACTION_TYPES.CREDIT}' or '${TRANSACTION_TYPES.DEBIT}'`,
    }),
  }),
  amount: z
    .number({
      required_error: 'Transaction amount is required',
      invalid_type_error: 'Transaction amount must be a valid number',
    })
    .gt(0, 'Transaction amount must be greater than 0')
    .refine((val) => hasAtMostTwoDecimals(val), {
      message: 'Transaction amount can have at most 2 decimal places',
    }),
  description: z
    .string({
      invalid_type_error: 'Description must be a string',
    })
    .trim()
    .max(255, 'Description cannot exceed 255 characters')
    .optional()
    .default(''),
  reference_id: z
    .string({
      required_error: 'reference_id is required',
      invalid_type_error: 'reference_id must be a string',
    })
    .trim()
    .min(1, 'reference_id cannot be empty'),
});

export const getTransactionHistoryQuerySchema = z.object({
  type: z
    .enum([TRANSACTION_TYPES.CREDIT, TRANSACTION_TYPES.DEBIT], {
      errorMap: () => ({
        message: `Query parameter 'type' must be either '${TRANSACTION_TYPES.CREDIT}' or '${TRANSACTION_TYPES.DEBIT}'`,
      }),
    })
    .optional(),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: "Query parameter 'page' must be an integer greater than or equal to 1",
    }),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: "Query parameter 'limit' must be an integer between 1 and 100",
    }),
});

export default {
  addTransactionSchema,
  getTransactionHistoryQuerySchema,
};
