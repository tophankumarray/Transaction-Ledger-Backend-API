const authService = require('../services/authService');
const { successResponse } = require('../utils/responseFormatter');

class AuthController {
  /**
   * POST /api/v1/auth/register
   * Registers a new user account.
   */
  async register(req, res) {
    const { username, email, password } = req.body;
    const result = await authService.register({ username, email, password });

    return res.status(201).json(
      successResponse(result, 'User registered successfully')
    );
  }

  /**
   * POST /api/v1/auth/login
   * Authenticates user and returns JWT.
   */
  async login(req, res) {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    return res.status(200).json(
      successResponse(result, 'Login successful')
    );
  }

  /**
   * GET /api/v1/auth/me
   * Retrieves profile of current authenticated user.
   */
  async getMe(req, res) {
    const user = req.user;
    return res.status(200).json(
      successResponse(user, 'Current user profile retrieved')
    );
  }
}

module.exports = new AuthController();
