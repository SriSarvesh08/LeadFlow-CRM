jest.mock('../src/config/db', () => ({
  sequelize: { authenticate: jest.fn().mockResolvedValue() },
  testConnection: jest.fn().mockResolvedValue(true),
}));

const request = require('supertest');
const app = require('../src/app');

describe('Customers Service — Baseline Health Endpoint Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('GET /health reports process liveness with 200 operational status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      service: 'customers-service',
      status: 'operational',
    });
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('port');
  });

  test('GET /health runs independently without database connectivity', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('operational');
  });
});
