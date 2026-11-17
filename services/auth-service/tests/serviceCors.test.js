const path = require('path');
const request = require('supertest');

const repoRoot = path.resolve(__dirname, '../../..');
const servicesRoot = path.join(repoRoot, 'services');

const services = [
  'auth-service',
  'customers-service',
  'sales-service',
  'leads-service',
  'activity-service',
  'notification-service',
  'support-service',
];

describe.each(services)('%s — Service-Level CORS Behavior', (serviceName) => {
  let app;
  const originalFrontendUrl = process.env.FRONTEND_URL;
  const originalAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS;

  beforeAll(() => {
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:5173, https://admin.leadflow.in';
    const appPath = path.join(servicesRoot, serviceName, 'src', 'app.js');
    jest.isolateModules(() => {
      app = require(appPath);
    });
  });

  afterAll(() => {
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
    if (originalAllowedOrigins === undefined) {
      delete process.env.CORS_ALLOWED_ORIGINS;
    } else {
      process.env.CORS_ALLOWED_ORIGINS = originalAllowedOrigins;
    }
  });

  test('allows requests matching FRONTEND_URL', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBeUndefined();
  });

  test('allows requests matching comma-separated CORS_ALLOWED_ORIGINS', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://admin.leadflow.in');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://admin.leadflow.in');
  });

  test('does not allow requests from unauthorized origins', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://malicious-site.example.com');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('handles OPTIONS preflight with allowed methods and headers', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-methods']).toMatch(/GET/);
    expect(res.headers['access-control-allow-methods']).toMatch(/POST/);
    expect(res.headers['access-control-allow-headers']).toMatch(/Content-Type/i);
    expect(res.headers['access-control-allow-headers']).toMatch(/Authorization/i);
  });
});
