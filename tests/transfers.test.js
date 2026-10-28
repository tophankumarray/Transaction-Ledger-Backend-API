const request = require('supertest');
const app = require('../src/app');
const { AUTH_HEADER } = require('./authHelper');

describe('Bonus: Money Transfer API Endpoints', () => {
  let accountAId;
  let accountBId;

  beforeEach(async () => {
    // Create Account A with 100 balance
    const accA = await request(app)
      .post('/api/v1/accounts')
      .set(AUTH_HEADER)
      .send({ name: 'Account A' });
    accountAId = accA.body.data.id;

    await request(app)
      .post(`/api/v1/accounts/${accountAId}/transactions`)
      .set(AUTH_HEADER)
      .send({ type: 'credit', amount: 100, reference_id: 'seed-acc-a' });

    // Create Account B with 50 balance
    const accB = await request(app)
      .post('/api/v1/accounts')
      .set(AUTH_HEADER)
      .send({ name: 'Account B' });
    accountBId = accB.body.data.id;

    await request(app)
      .post(`/api/v1/accounts/${accountBId}/transactions`)
      .set(AUTH_HEADER)
      .send({ type: 'credit', amount: 50, reference_id: 'seed-acc-b' });
  });

  describe('POST /api/v1/transfers', () => {
    it('should transfer money from Account A (100) to Account B (50) of 30 -> A: 70, B: 80', async () => {
      const transferRes = await request(app)
        .post('/api/v1/transfers')
        .set(AUTH_HEADER)
        .send({
          source_account_id: accountAId,
          destination_account_id: accountBId,
          amount: 30,
          description: 'Payment for services',
          reference_id: 'transfer-ref-001',
        });

      expect(transferRes.status).toBe(201);
      expect(transferRes.body.success).toBe(true);
      expect(transferRes.body.data.source_account.new_balance).toBe(70);
      expect(transferRes.body.data.destination_account.new_balance).toBe(80);

      // Verify balances via GET /balance
      const balA = await request(app)
        .get(`/api/v1/accounts/${accountAId}/balance`)
        .set(AUTH_HEADER);
      const balB = await request(app)
        .get(`/api/v1/accounts/${accountBId}/balance`)
        .set(AUTH_HEADER);
      expect(balA.body.data.balance).toBe(70);
      expect(balB.body.data.balance).toBe(80);

      // Verify transaction histories of both accounts
      const historyA = await request(app)
        .get(`/api/v1/accounts/${accountAId}/transactions`)
        .set(AUTH_HEADER);
      expect(historyA.body.data[0].type).toBe('debit');
      expect(historyA.body.data[0].amount).toBe(30);

      const historyB = await request(app)
        .get(`/api/v1/accounts/${accountBId}/transactions`)
        .set(AUTH_HEADER);
      expect(historyB.body.data[0].type).toBe('credit');
      expect(historyB.body.data[0].amount).toBe(30);
    });

    it('should reject transfer if source account has insufficient balance and rollback completely', async () => {
      // Account A has 100, attempts to transfer 150
      const transferRes = await request(app)
        .post('/api/v1/transfers')
        .set(AUTH_HEADER)
        .send({
          source_account_id: accountAId,
          destination_account_id: accountBId,
          amount: 150,
          reference_id: 'transfer-excess',
        });

      expect(transferRes.status).toBe(400);
      expect(transferRes.body.error.code).toBe('INSUFFICIENT_BALANCE');

      // Balances must remain unchanged: A is 100, B is 50
      const balA = await request(app)
        .get(`/api/v1/accounts/${accountAId}/balance`)
        .set(AUTH_HEADER);
      const balB = await request(app)
        .get(`/api/v1/accounts/${accountBId}/balance`)
        .set(AUTH_HEADER);
      expect(balA.body.data.balance).toBe(100);
      expect(balB.body.data.balance).toBe(50);
    });

    it('should reject transfer if source or destination account does not exist', async () => {
      const res1 = await request(app)
        .post('/api/v1/transfers')
        .set(AUTH_HEADER)
        .send({
          source_account_id: 'non-existent-source',
          destination_account_id: accountBId,
          amount: 20,
          reference_id: 'transfer-invalid-src',
        });
      expect(res1.status).toBe(404);
      expect(res1.body.error.code).toBe('ACCOUNT_NOT_FOUND');

      const res2 = await request(app)
        .post('/api/v1/transfers')
        .set(AUTH_HEADER)
        .send({
          source_account_id: accountAId,
          destination_account_id: 'non-existent-dest',
          amount: 20,
          reference_id: 'transfer-invalid-dst',
        });
      expect(res2.status).toBe(404);
      expect(res2.body.error.code).toBe('ACCOUNT_NOT_FOUND');
    });

    it('should reject transfer to the same account', async () => {
      const res = await request(app)
        .post('/api/v1/transfers')
        .set(AUTH_HEADER)
        .send({
          source_account_id: accountAId,
          destination_account_id: accountAId,
          amount: 20,
          reference_id: 'transfer-same-acc',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('different');
    });

    it('should reject duplicate transfer reference_id', async () => {
      // First transfer of 20
      const res1 = await request(app)
        .post('/api/v1/transfers')
        .set(AUTH_HEADER)
        .send({
          source_account_id: accountAId,
          destination_account_id: accountBId,
          amount: 20,
          reference_id: 'duplicate-transfer-ref',
        });
      expect(res1.status).toBe(201);

      // Repeat transfer with same reference_id
      const res2 = await request(app)
        .post('/api/v1/transfers')
        .set(AUTH_HEADER)
        .send({
          source_account_id: accountAId,
          destination_account_id: accountBId,
          amount: 20,
          reference_id: 'duplicate-transfer-ref',
        });

      expect(res2.status).toBe(409);
      expect(res2.body.error.code).toBe('DUPLICATE_TRANSACTION_REFERENCE');

      // Balances should reflect only the first transfer: A=80, B=70
      const balA = await request(app)
        .get(`/api/v1/accounts/${accountAId}/balance`)
        .set(AUTH_HEADER);
      const balB = await request(app)
        .get(`/api/v1/accounts/${accountBId}/balance`)
        .set(AUTH_HEADER);
      expect(balA.body.data.balance).toBe(80);
      expect(balB.body.data.balance).toBe(70);
    });
  });
});
