const { z } = require('zod');
const { hasAtMostTwoDecimals } = require('../utils/math');

const createTransferSchema = z
  .object({
    source_account_id: z
      .string({
        required_error: 'source_account_id is required',
        invalid_type_error: 'source_account_id must be a string',
      })
      .trim()
      .min(1, 'source_account_id cannot be empty'),
    destination_account_id: z
      .string({
        required_error: 'destination_account_id is required',
        invalid_type_error: 'destination_account_id must be a string',
      })
      .trim()
      .min(1, 'destination_account_id cannot be empty'),
    amount: z
      .number({
        required_error: 'Transfer amount is required',
        invalid_type_error: 'Transfer amount must be a valid number',
      })
      .gt(0, 'Transfer amount must be greater than 0')
      .refine((val) => hasAtMostTwoDecimals(val), {
        message: 'Transfer amount can have at most 2 decimal places',
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
  })
  .refine(
    (data) => data.source_account_id !== data.destination_account_id,
    {
      message: 'Source and destination accounts must be different',
      path: ['destination_account_id'],
    }
  );

module.exports = {
  createTransferSchema,
};

