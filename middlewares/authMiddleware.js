import authService from '../services/authService.js';
import env from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';
import { ERROR_CODES } from '../constants/transactionTypes.js';

/**
 * Authentication middleware to protect endpoints.
 * Supports both JWT Bearer Tokens (Authorization: Bearer <token>)
 * and API Key authentication (x-api-key: <key>).
 */
export const authenticate = (req, res, next) => {
  // 1. Check for API Key header
  const apiKey = req.headers['x-api-key'];
  if (apiKey && env.API_KEY && apiKey === env.API_KEY) {
    req.user = {
      id: 'api-key-client',
      username: 'api-client',
      role: 'admin',
      auth_type: 'api_key',
    };
    return next();
  }

  // 2. Check for Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(
      new UnauthorizedError(
        'Authentication required. Please provide a Bearer token in Authorization header or a valid x-api-key.',
        ERROR_CODES.UNAUTHORIZED
      )
    );
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return next(
      new UnauthorizedError(
        "Invalid Authorization header format. Expected 'Bearer <token>'",
        ERROR_CODES.UNAUTHORIZED
      )
    );
  }

  const token = parts[1];

  try {
    const decoded = authService.verifyToken(token);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      auth_type: 'jwt',
    };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Role-based authorization middleware
 * @param  {...string} allowedRoles
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required', ERROR_CODES.UNAUTHORIZED));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: Role '${req.user.role}' does not have permission to access this resource`,
          ERROR_CODES.FORBIDDEN
        )
      );
    }
    next();
  };
};

export default {
  authenticate,
  requireRole,
};
