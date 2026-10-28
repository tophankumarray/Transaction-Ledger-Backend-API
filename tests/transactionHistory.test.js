const request = require('supertest');
const app = require('../src/app');

describe('Transaction History API Endpoints', () => {
  let testAccountId;

  beforeEach(async () => {
    // 1. Create account
    const accRes = await request(app)
      .post('/api/v1/accounts')
      .send({ name: 'History Test User' });
    testAccountId = accRes.body.data.id;

    // 2. Populate transactions with sequential delays to ensure created_at ordering
    const transactionsToSeed = [
      { type: 'credit', amount: 100, reference_id: 'seed-1', description: 'Initial seed' },
      { type: 'credit', amount: 50, reference_id: 'seed-2', description: 'Second credit' },
      { type: 'debit', amount: 30, reference_id: 'seed-3', description: 'First debit' },
      { type: 'credit', amount: 200, reference_id: 'seed-4', description: 'Third credit' },
      { type: 'debit', amount: 70, reference_id: 'seed-5', description: 'Second debit' },
    ];

    for (const tx of transactionsToSeed) {
      await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .send(tx);
    }
  });

  describe('GET /api/v1/accounts/:accountId/transactions - History', () => {
    it('should return all transactions sorted latest-first when no filter provided', async () => {
      const res = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/transactions`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(5);

      // Verify pagination metadata
      expect(res.body.meta).toEqual({
        current_page: 1,
        page_size: 10,
        total_records: 5,
        total_pages: 1,
      });

      // Verify latest-first ordering (seed-5 was created last, so it should be first)
      expect(res.body.data[0].reference_id).toBe('seed-5');
      expect(res.body.data[4].reference_id).toBe('seed-1');

      // Verify each item contains required fields
      for (const item of res.body.data) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('account_id', testAccountId);
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('amount');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('reference_id');
        expect(item).toHaveProperty('created_at');
      }
    });

    it('should filter transactions by credit type', async () => {
      const res = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/transactions?type=credit`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.meta.total_records).toBe(3);
      res.body.data.forEach((tx) => {
        expect(tx.type).toBe('credit');
      });
      // Latest credit was seed-4
      expect(res.body.data[0].reference_id).toBe('seed-4');
    });

    it('should filter transactions by debit type', async () => {
      const res = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/transactions?type=debit`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total_records).toBe(2);
      res.body.data.forEach((tx) => {
        expect(tx.type).toBe('debit');
      });
      // Latest debit was seed-5
      expect(res.body.data[0].reference_id).toBe('seed-5');
      expect(res.body.data[1].reference_id).toBe('seed-3');
    });

    it('should support pagination (page and limit)', async () => {
      // Page 1, limit 2
      const page1Res = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/transactions?page=1&limit=2`);

      expect(page1Res.status).toBe(200);
      expect(page1Res.body.data.length).toBe(2);
      expect(page1Res.body.meta).toEqual({
        current_page: 1,
        page_size: 2,
        total_records: 5,
        total_pages: 3,
      });
      expect(page1Res.body.data[0].reference_id).toBe('seed-5');
      expect(page1Res.body.data[1].reference_id).toBe('seed-4');

      // Page 2, limit 2
      const page2Res = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/transactions?page=2&limit=2`);

      expect(page2Res.status).toBe(200);
      expect(page2Res.body.data.length).toBe(2);
      expect(page2Res.body.meta.current_page).toBe(2);
      expect(page2Res.body.data[0].reference_id).toBe('seed-3');
      expect(page2Res.body.data[1].reference_id).toBe('seed-2');

      // Page 3, limit 2 (last remaining record)
      const page3Res = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/transactions?page=3&limit=2`);

      expect(page3Res.status).toBe(200);
      expect(page3Res.body.data.length).toBe(1);
      expect(page3Res.body.meta.current_page).toBe(3);
      expect(page3Res.body.data[0].reference_id).toBe('seed-1');
    });

    it('should return 404 for non-existent account', async () => {
      const res = await request(app)
        .get('/api/v1/accounts/non-existent-acc/transactions');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ACCOUNT_NOT_FOUND');
    });

    it('should reject invalid pagination parameters', async () => {
      const res = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/transactions?page=0`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
