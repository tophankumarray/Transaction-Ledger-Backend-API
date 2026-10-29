import { ValidationError } from '../errors/index.js';

/**
 * Middleware factory for validating incoming request parts (body, query, params)
 * using Zod schemas.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      const primaryMessage = details[0] ? details[0].message : 'Validation failed';
      return next(new ValidationError(primaryMessage, details));
    }

    // Assign sanitized / parsed data back to req[source]
    req[source] = result.data;
    next();
  };
};

export default validate;
