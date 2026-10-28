const request = require('supertest');
const app = require('../src/app');
const Transaction = require('../src/models/Transaction');
const { AUTH_HEADER } = require('./authHelper');

describe('Data Integrity & Consistency', () => {
  let testAccountId;

  beforeEach(async () => {
    const accRes = await request(app)
      .post('/api/v1/accounts')
      .set(AUTH_HEADER)
      .send({ name: 'Ledger Audit Account' });
    testAccountId = accRes.body.data.id;
  });

  describe('Sequential Balance Consistency Rule', () => {
    it('should exactly match specification example: 0 + 100 + 50 - 30 - 20 = 100', async () => {
      // Step 1: Initial balance: 0
      let balRes = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set(AUTH_HEADER);
      expect(balRes.body.data.balance).toBe(0);

      // Step 2: Credit 100
      await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({ type: 'credit', amount: 100, reference_id: 'seq-tx-1' });

      balRes = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set(AUTH_HEADER);
      expect(balRes.body.data.balance).toBe(100);

      // Step 3: Credit 50
      await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({ type: 'credit', amount: 50, reference_id: 'seq-tx-2' });

      balRes = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set(AUTH_HEADER);
      expect(balRes.body.data.balance).toBe(150);

      // Step 4: Debit 30
      await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({ type: 'debit', amount: 30, reference_id: 'seq-tx-3' });

      balRes = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set(AUTH_HEADER);
      expect(balRes.body.data.balance).toBe(120);

      // Step 5: Debit 20
      await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({ type: 'debit', amount: 20, reference_id: 'seq-tx-4' });

      // Step 6: Final balance: 100
      balRes = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set(AUTH_HEADER);
      expect(balRes.body.data.balance).toBe(100);

      // Step 7: Rejected transaction (debit 200) should NOT affect balance
      const failedDebit = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({ type: 'debit', amount: 200, reference_id: 'seq-tx-fail' });
      expect(failedDebit.status).toBe(400);

      balRes = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set(AUTH_HEADER);
      expect(balRes.body.data.balance).toBe(100);
    });
  });

  describe('Transaction Immutability', () => {
    it('should not expose any update or delete API routes for transactions', async () => {
      // Create a transaction first
      const txRes = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({ type: 'credit', amount: 50, reference_id: 'immutable-tx-1' });
      const txId = txRes.body.data.id;

      // Attempt PUT
      const putRes = await request(app)
        .put(`/api/v1/accounts/${testAccountId}/transactions/${txId}`)
        .set(AUTH_HEADER)
        .send({ amount: 999 });
      expect(putRes.status).toBe(404);

      // Attempt PATCH
      const patchRes = await request(app)
        .patch(`/api/v1/accounts/${testAccountId}/transactions/${txId}`)
        .set(AUTH_HEADER)
        .send({ amount: 999 });
      expect(patchRes.status).toBe(404);

      // Attempt DELETE
      const deleteRes = await request(app)
        .delete(`/api/v1/accounts/${testAccountId}/transactions/${txId}`)
        .set(AUTH_HEADER);
      expect(deleteRes.status).toBe(404);
    });

    it('should throw an error at model layer if update or delete is attempted directly', async () => {
      const txRes = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/transactions`)
        .set(AUTH_HEADER)
        .send({ type: 'credit', amount: 50, reference_id: 'model-immutable-tx' });
      const txId = txRes.body.data.id;

      // Direct update attempt
      await expect(
        Transaction.updateOne({ id: txId }, { amount: 500 })
      ).rejects.toThrow('Transactions are immutable');

      // Direct delete attempt
      await expect(
        Transaction.deleteOne({ id: txId })
      ).rejects.toThrow('Transactions are immutable');
    });
  });
});
