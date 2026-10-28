const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} = require('../errors');
const { ERROR_CODES } = require('../constants/transactionTypes');

class AuthService {
  /**
   * Generates a signed JWT for an authenticated user.
   * @param {object} user
   * @returns {string}
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  /**
   * Verifies and decodes a JWT token.
   * @param {string} token
   * @returns {object}
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired', ERROR_CODES.UNAUTHORIZED);
      }
      throw new UnauthorizedError('Invalid authentication token', ERROR_CODES.UNAUTHORIZED);
    }
  }

  /**
   * Registers a new user.
   * @param {object} param0
   * @param {string} param0.username
   * @param {string} param0.email
   * @param {string} param0.password
   * @returns {Promise<{ user: object, token: string }>}
   */
  async register({ username, email, password }) {
    // Check if user with same email or username already exists
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existing) {
      if (existing.email === email.toLowerCase()) {
        throw new ConflictError(
          'A user with this email address already exists',
          ERROR_CODES.USER_ALREADY_EXISTS
        );
      }
      throw new ConflictError(
        'A user with this username already exists',
        ERROR_CODES.USER_ALREADY_EXISTS
      );
    }

    const user = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    await user.save();
    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Authenticates user with email and password.
   * @param {object} param0
   * @param {string} param0.email
   * @param {string} param0.password
   * @returns {Promise<{ user: object, token: string }>}
   */
  async login({ email, password }) {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      throw new UnauthorizedError(
        'Invalid email or password',
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError(
        'Invalid email or password',
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Fetches user profile by ID.
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async getUserById(userId) {
    const user = await User.findOne({ id: userId });
    if (!user) {
      throw new NotFoundError('User not found', ERROR_CODES.NOT_FOUND);
    }
    return user.toJSON();
  }
}

module.exports = new AuthService();
