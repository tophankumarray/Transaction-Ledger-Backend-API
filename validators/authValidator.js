import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string({
      required_error: 'Username is required',
      invalid_type_error: 'Username must be a string',
    })
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters'),
  email: z
    .string({
      required_error: 'Email is required',
    })
    .trim()
    .email('Please provide a valid email address'),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
});

export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .trim()
    .email('Please provide a valid email address'),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(1, 'Password cannot be empty'),
});

export default {
  registerSchema,
  loginSchema,
};
