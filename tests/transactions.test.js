const request = require('supertest');
const app = require('../src/app');
const { AUTH_HEADER } = require('./authHelper');

describe('Transaction API Endpoints', () => {
  let testAccountId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .set(AUTH_HEADER)
      .send({ name: 'Transaction Test Account' });
    testAccountId = res.body.data.id;
  });

  describe('Credit Transactions', () => {
    it('should successfully credit account and increase balance', async () => {
      // Credit 100
      const tx1 = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'credit',
          amount: 100,
          description: 'Initial deposit',
          reference_id: 'ref-credit-001',
        });

      expect(tx1.status).toBe(201);
      expect(tx1.body.success).toBe(true);
      expect(tx1.body.data).toMatchObject({
        account_id: testAccountId,
        type: 'credit',
        amount: 100,
        description: 'Initial deposit',
        reference_id: 'ref-credit-001',
      });
      expect(tx1.body.meta.current_balance).toBe(100);

      // Verify balance endpoint reflects new balance
      const balanceRes = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set(AUTH_HEADER);
      expect(balanceRes.body.data.balance).toBe(100);

      // Additional credit 50
      const tx2 = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'credit',
          amount: 50,
          description: 'Bonus payment',
          reference_id: 'ref-credit-002',
        });

      expect(tx2.status).toBe(201);
      expect(tx2.body.meta.current_balance).toBe(150);

      const balanceRes2 = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set(AUTH_HEADER);
      expect(balanceRes2.body.data.balance).toBe(150);
    });
  });

  describe('Debit Transactions', () => {
    beforeEach(async () => {
      // Fund account with 100 first
      await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'credit',
          amount: 100,
          reference_id: 'seed-credit-100',
        });
    });

    it('should successfully debit account when sufficient balance exists', async () => {
      // Debit 30 from 100 -> New balance: 70
      const res = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'debit',
          amount: 30,
          description: 'Grocery shopping',
          reference_id: 'ref-debit-001',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        account_id: testAccountId,
        type: 'debit',
        amount: 30,
        reference_id: 'ref-debit-001',
      });
      expect(res.body.meta.current_balance).toBe(70);

      // Verify balance endpoint
      const balanceRes = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set(AUTH_HEADER);
      expect(balanceRes.body.data.balance).toBe(70);
    });

    it('should reject debit transaction when account has insufficient balance', async () => {
      // Current balance: 100. Attempt Debit: 150
      const res = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'debit',
          amount: 150,
          description: 'Overdraft attempt',
          reference_id: 'ref-debit-excess',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_BALANCE');

      // Balance must remain unchanged at 100
      const balanceRes = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set(AUTH_HEADER);
      expect(balanceRes.body.data.balance).toBe(100);
    });
  });

  describe('Duplicate Transaction Reference Handling', () => {
    it('should reject duplicate reference_id for the same account and not change balance', async () => {
      // 1. Initial credit
      const initialTx = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'credit',
          amount: 100,
          description: 'Salary',
          reference_id: 'tx-ref-unique-123',
        });
      expect(initialTx.status).toBe(201);

      // 2. Submit same transaction with duplicate reference_id
      const duplicateTx = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'credit',
          amount: 100,
          description: 'Salary re-submission',
          reference_id: 'tx-ref-unique-123',
        });

      expect(duplicateTx.status).toBe(409);
      expect(duplicateTx.body.success).toBe(false);
      expect(duplicateTx.body.error.code).toBe('DUPLICATE_TRANSACTION_REFERENCE');

      // 3. Balance must remain 100, NOT 200
      const balanceRes = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set(AUTH_HEADER);
      expect(balanceRes.body.data.balance).toBe(100);
    });

    it('should allow the same reference_id across DIFFERENT accounts', async () => {
      // Create second account
      const acc2Res = await request(app)
        .post('/api/v1/accounts')
        .set(AUTH_HEADER)
        .send({ name: 'Second Account' });
      const testAccountId2 = acc2Res.body.data.id;

      const sharedRefId = 'shared-reference-id-456';

      // First account uses sharedRefId
      const tx1 = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'credit',
          amount: 50,
          reference_id: sharedRefId,
        });
      expect(tx1.status).toBe(201);

      // Second account uses same sharedRefId
      const tx2 = await request(app)
        .post(`/api/v1/accounts/${testAccountId2}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'credit',
          amount: 80,
          reference_id: sharedRefId,
        });
      expect(tx2.status).toBe(201);

      // Check balances
      const bal1 = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set(AUTH_HEADER);
      const bal2 = await request(app)
        .get(`/api/v1/accounts/${testAccountId2}/balance`)
        .set(AUTH_HEADER);
      expect(bal1.body.data.balance).toBe(50);
      expect(bal2.body.data.balance).toBe(80);
    });
  });

  describe('Validation & Edge Cases', () => {
    it('should return 404 if account does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/accounts/non-existent-id/transactions')
        .set(AUTH_HEADER)
        .send({
          type: 'credit',
          amount: 50,
          reference_id: 'some-ref',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ACCOUNT_NOT_FOUND');
    });

    it('should reject invalid transaction type', async () => {
      const res = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'invalid_type',
          amount: 50,
          reference_id: 'ref-type-test',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject amount <= 0', async () => {
      const res1 = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'credit',
          amount: 0,
          reference_id: 'zero-amount',
        });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'credit',
          amount: -25,
          reference_id: 'negative-amount',
        });
      expect(res2.status).toBe(400);
    });

    it('should reject amount with more than 2 decimal places', async () => {
      const res = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'credit',
          amount: 10.999,
          reference_id: 'too-many-decimals',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('at most 2 decimal places');
    });

    it('should reject missing reference_id', async () => {
      const res = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({
          type: 'credit',
          amount: 10,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should support direct POST /api/v1/transactions with account_id in body', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set(AUTH_HEADER)
        .send({
          account_id: testAccountId,
          type: 'credit',
          amount: 65.50,
          description: 'Direct transaction route',
          reference_id: 'direct-route-ref',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(65.5);
      expect(res.body.meta.current_balance).toBe(65.5);
    });
  });
});
