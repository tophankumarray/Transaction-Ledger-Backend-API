import express from 'express';
import authController from '../controllers/authController.js';
import validate from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';

const router = express.Router();

// User Registration: POST /api/v1/auth/register
router.post(
  '/register',
  validate(registerSchema, 'body'),
  asyncHandler((req, res) => authController.register(req, res))
);

// User Login: POST /api/v1/auth/login
router.post(
  '/login',
  validate(loginSchema, 'body'),
  asyncHandler((req, res) => authController.login(req, res))
);

// Current User Profile: GET /api/v1/auth/me (Protected)
router.get(
  '/me',
  authenticate,
  asyncHandler((req, res) => authController.getMe(req, res))
);

export default router;
