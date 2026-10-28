const request = require('supertest');
const app = require('../src/app');

describe('Health and Root Endpoints', () => {
  it('GET / should return service info and endpoint list', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Transaction Ledger Backend API');
    expect(res.body).toHaveProperty('endpoints');
  });

  it('GET /api/v1/health should return health status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('acid_transactions_enabled');
  });

  it('GET /api/v1/unknown-route should return 404 with standard error JSON', async () => {
    const res = await request(app).get('/api/v1/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });
});

