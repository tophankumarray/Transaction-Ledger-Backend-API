const { z } = require('zod');

const createAccountSchema = z
  .object({
    name: z
      .string({
        required_error: 'Account holder name is required',
        invalid_type_error: 'Account holder name must be a string',
      })
      .trim()
      .min(1, 'Account holder name cannot be empty')
      .max(100, 'Account holder name cannot exceed 100 characters'),
    balance: z.any().optional(),
  })
  .refine(
    (data) => data.balance === undefined,
    {
      message: 'Initial balance cannot be set by the client. Accounts always initialize with 0 balance.',
      path: ['balance'],
    }
  );

const accountParamSchema = z.object({
  accountId: z
    .string({
      required_error: 'Account ID parameter is required',
    })
    .trim()
    .min(1, 'Account ID parameter cannot be empty'),
});

module.exports = {
  createAccountSchema,
  accountParamSchema,
};
