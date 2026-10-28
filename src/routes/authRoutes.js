const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { registerSchema, loginSchema } = require('../validators/authValidator');

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

module.exports = router;
