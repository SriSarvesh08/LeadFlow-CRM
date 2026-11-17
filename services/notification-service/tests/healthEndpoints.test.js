jest.mock('../src/config/db', () => jest.fn().mockResolvedValue({}));
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      ...actual.connection,
      readyState: 1,
    },
  };
});

const request = require('supertest');
const app = require('../src/app');

describe('Notification Service — Baseline Health Endpoint Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('GET /health reports process liveness with 200 operational status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      service: 'notification-service',
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
