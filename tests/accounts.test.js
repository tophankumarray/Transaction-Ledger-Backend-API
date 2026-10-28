const request = require('supertest');
const app = require('../src/app');
const { AUTH_HEADER } = require('./authHelper');

describe('Account API Endpoints', () => {
  describe('POST /api/v1/accounts - Create Account', () => {
    it('should successfully create an account with balance 0 and system generated id and created_at', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set(AUTH_HEADER)
        .send({ name: 'Alice Smith' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(typeof res.body.data.id).toBe('string');
      expect(res.body.data.name).toBe('Alice Smith');
      expect(res.body.data.balance).toBe(0);
      expect(res.body.data).toHaveProperty('created_at');
    });

    it('should reject creation if name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set(AUTH_HEADER)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject creation if name is empty or only whitespace', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set(AUTH_HEADER)
        .send({ name: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject creation if client attempts to provide initial balance', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set(AUTH_HEADER)
        .send({ name: 'Bob Jones', balance: 500 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Initial balance cannot be set by the client');
    });
  });

  describe('GET /api/v1/accounts/:accountId/balance - Get Account Balance', () => {
    it('should return current balance for an existing account', async () => {
      // First create account
      const createRes = await request(app)
        .post('/api/v1/accounts')
        .set(AUTH_HEADER)
        .send({ name: 'Charlie Brown' });

      const accountId = createRes.body.data.id;

      // Fetch balance
      const balanceRes = await request(app)
        .get(`/api/v1/accounts/${accountId}/balance`)
        .set(AUTH_HEADER);

      expect(balanceRes.status).toBe(200);
      expect(balanceRes.body.success).toBe(true);
      expect(balanceRes.body.data).toEqual({
        account_id: accountId,
        balance: 0,
      });
    });

    it('should return 404 when querying balance for non-existent account', async () => {
      const nonExistentId = 'non-existent-account-id';
      const res = await request(app)
        .get(`/api/v1/accounts/${nonExistentId}/balance`)
        .set(AUTH_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCOUNT_NOT_FOUND');
    });
  });

  describe('GET /api/v1/accounts/:accountId - Get Account Details', () => {
    it('should fetch full account details', async () => {
      const createRes = await request(app)
        .post('/api/v1/accounts')
        .set(AUTH_HEADER)
        .send({ name: 'Diana Prince' });

      const accountId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/v1/accounts/${accountId}`)
        .set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(accountId);
      expect(res.body.data.name).toBe('Diana Prince');
      expect(res.body.data.balance).toBe(0);
    });

    it('should return 404 for non-existent account', async () => {
      const res = await request(app)
        .get('/api/v1/accounts/invalid-uuid')
        .set(AUTH_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ACCOUNT_NOT_FOUND');
    });
  });
});
