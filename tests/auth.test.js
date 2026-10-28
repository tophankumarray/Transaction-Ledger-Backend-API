const request = require('supertest');
const app = require('../src/app');

describe('Authentication & Protected Routes', () => {
  const testUser = {
    username: 'ledgeruser',
    email: 'ledgeruser@example.com',
    password: 'password123',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user and return a JWT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toMatchObject({
        username: testUser.username,
        email: testUser.email,
        role: 'user',
      });
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should reject registration if email is already taken', async () => {
      // Create user first
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      // Attempt to register again with same email
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'anotheruser',
          email: testUser.email,
          password: 'password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('USER_ALREADY_EXISTS');
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'validusername',
          email: 'not-an-email',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with short password (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'validuser2',
          email: 'user2@example.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register test user before each login test
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
    });

    it('should authenticate user and return token with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anyPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Protected Route Verification', () => {
    let token;

    beforeEach(async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
      token = regRes.body.data.token;
    });

    it('should block access to /api/v1/accounts without authentication (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .send({ name: 'Unauthenticated User' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('Authentication required');
    });

    it('should block access with malformed Authorization header (401)', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', 'InvalidFormat')
        .send({ name: 'Unauthenticated User' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should block access with invalid JWT token (401)', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .send({ name: 'Unauthenticated User' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow access to protected route with valid Bearer JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Authenticated Account' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Authenticated Account');
    });

    it('should allow access to protected route with valid x-api-key header', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set('x-api-key', 'ledger-api-key-secret-2026')
        .send({ name: 'API Key Account' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('API Key Account');
    });

    it('GET /api/v1/auth/me should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.username).toBe(testUser.username);
    });
  });
});
