const gatewayAuth = require('../src/middleware/gatewayAuth');

describe('Gateway authentication public-route matching', () => {
  test('allows an exact public route with a query string', () => {
    const next = jest.fn();

    gatewayAuth(
      { path: '/api/auth/login', originalUrl: '/api/auth/login?source=test', headers: {} },
      {},
      next
    );

    expect(next).toHaveBeenCalledWith();
  });

  test.each([
    '/api/auth/login-extra',
    '/api/public/lead-form-extra',
    '/api/leads/public/lead-form-extra',
  ])('requires authentication for public-route prefix variant %s', (routePath) => {
    const next = jest.fn();

    gatewayAuth({ path: routePath, originalUrl: routePath, headers: {} }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({
      message: 'Authentication token required',
    });
  });
});
