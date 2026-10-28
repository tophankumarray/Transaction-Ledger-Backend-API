const jwt = require('jsonwebtoken');
const env = require('../src/config/env');

const generateTestToken = (payload = {}) => {
  return jwt.sign(
    {
      id: 'test-user-id',
      username: 'testadmin',
      email: 'admin@example.com',
      role: 'admin',
      ...payload,
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const AUTH_HEADER = {
  Authorization: `Bearer ${generateTestToken()}`,
};

const API_KEY_HEADER = {
  'x-api-key': env.API_KEY,
};

module.exports = {
  generateTestToken,
  AUTH_HEADER,
  API_KEY_HEADER,
};
