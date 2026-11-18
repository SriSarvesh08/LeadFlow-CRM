const fs = require('fs');
const path = require('path');
const createCorsOptions = require('../../shared/corsOptions');

const repoRoot = path.resolve(__dirname, '../..');

const isOriginAllowed = (options, origin) =>
  new Promise((resolve, reject) => {
    options.origin(origin, (error, allowed) => {
      if (error) {
        reject(error);
      } else {
        resolve(allowed);
      }
    });
  });

describe('Shared CORS policy', () => {
  test('allows the frontend URL and configured comma-separated origins exactly', async () => {
    const options = createCorsOptions({
      FRONTEND_URL: 'https://crm.example.com',
      CORS_ALLOWED_ORIGINS: 'https://admin.example.com, https://reports.example.com ',
    });

    await expect(isOriginAllowed(options, 'https://crm.example.com')).resolves.toBe(true);
    await expect(isOriginAllowed(options, 'https://admin.example.com')).resolves.toBe(true);
    await expect(isOriginAllowed(options, 'https://reports.example.com')).resolves.toBe(true);
    await expect(isOriginAllowed(options, 'https://crm.example.com.attacker.test')).resolves.toBe(false);
  });

  test('rejects unconfigured origins and requests without an Origin header', async () => {
    const options = createCorsOptions({ FRONTEND_URL: 'http://localhost:3000' });

    await expect(isOriginAllowed(options, 'http://localhost:5173')).resolves.toBe(false);
    await expect(isOriginAllowed(options, undefined)).resolves.toBe(false);
  });

  test('does not add localhost origins when production origins are not configured', async () => {
    const options = createCorsOptions({ NODE_ENV: 'production' });

    await expect(isOriginAllowed(options, 'http://localhost:3000')).resolves.toBe(false);
    await expect(isOriginAllowed(options, 'http://localhost:5173')).resolves.toBe(false);
  });

  test('disables credentials and restricts methods and headers', () => {
    const options = createCorsOptions({
      FRONTEND_URL: 'http://localhost:3000',
      CORS_ALLOWED_ORIGINS: '',
    });

    expect(options.credentials).toBe(false);
    expect(options.methods).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
    expect(options.allowedHeaders).toEqual(['Content-Type', 'Authorization']);
    expect(options.allowedHeaders).not.toContain('x-internal-key');
    expect(options.exposedHeaders).toEqual(['x-total-count']);
  });

  test('Gateway and all seven backend services use the shared CORS helper', () => {
    const gatewayCors = fs.readFileSync(
      path.join(repoRoot, 'gateway', 'src', 'middleware', 'corsConfig.js'),
      'utf8'
    );
    expect(gatewayCors).toMatch(/require\('\.\.\/\.\.\/\.\.\/shared\/corsOptions'\)/);
    expect(gatewayCors).toMatch(/cors\(createCorsOptions\(\)\)/);

    const servicesRoot = path.join(repoRoot, 'services');
    const serviceDirectories = fs.readdirSync(servicesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    const serviceApps = serviceDirectories.map((serviceName) => ({
      serviceName,
      appPath: path.join(servicesRoot, serviceName, 'src', 'app.js'),
    })).filter(({ appPath }) => fs.existsSync(appPath));

    expect(serviceApps).toHaveLength(7);
    serviceApps.forEach(({ serviceName, appPath }) => {
      const source = fs.readFileSync(appPath, 'utf8');
      expect(source).toMatch(/createCorsOptions[^;\n]*require\('\.\.\/\.\.\/\.\.\/shared'\)/);
      expect(source).toMatch(/app\.use\(cors\(createCorsOptions\(\)\)\)/);
      expect(source).not.toMatch(/app\.use\(cors\(\)\)/);
    });
  });
});
