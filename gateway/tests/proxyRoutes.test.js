const mockProxyOptions = [];

jest.doMock('../src/config/services', () => ({
  auth: { target: 'http://auth.test' },
  leads: { target: 'http://leads.test' },
  customers: { target: 'http://customers.test' },
  sales: { target: 'http://sales.test' },
  activity: { target: 'http://activity.test' },
  support: { target: 'http://support.test' },
  notifications: { target: 'http://notifications.test' },
}));

jest.doMock('http-proxy-middleware', () => ({
  createProxyMiddleware: (options) => {
    mockProxyOptions.push(options);
    return (req, res, next) => next();
  },
}));

require('../src/routes/proxyRoutes');

const findRewrite = (target, incomingUrl, expectedUrl) =>
  mockProxyOptions.find((options) =>
    options.target === target &&
    options.pathRewrite(incomingUrl, { originalUrl: incomingUrl }) === expectedUrl
  );

const proxyRequestHook = mockProxyOptions[0].on.proxyReq;

const createProxyRequest = (headers) => {
  const forwardedHeaders = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value])
  );
  return {
    headers: forwardedHeaders,
    setHeader: jest.fn((name, value) => {
      forwardedHeaders[name.toLowerCase()] = value;
    }),
    write: jest.fn(),
  };
};

describe('Gateway proxy path rewriting', () => {
  test.each([
    [
      'Auth',
      'http://auth.test',
      '/api/auth/users/42?expand=roles',
      '/auth/users/42?expand=roles',
    ],
    [
      'Leads',
      'http://leads.test',
      '/api/leads/42?status=new&page=2',
      '/leads/42?status=new&page=2',
    ],
    [
      'public lead form',
      'http://leads.test',
      '/api/public/lead-form?source=web',
      '/public/lead-form?source=web',
    ],
    [
      'Customers',
      'http://customers.test',
      '/api/accounts/42?include=contacts',
      '/accounts/42?include=contacts',
    ],
  ])('rewrites %s paths and preserves query parameters', (_name, target, incomingUrl, expectedUrl) => {
    expect(findRewrite(target, incomingUrl, expectedUrl)).toBeDefined();
  });

  test('leaves an unmatched path unchanged for a configured route rewrite', () => {
    const incomingUrl = '/api/unmapped?keep=true';
    const proxyOptions = mockProxyOptions.find((options) => options.target === 'http://auth.test');

    expect(proxyOptions.pathRewrite(incomingUrl, { originalUrl: incomingUrl })).toBe(incomingUrl);
  });
});

describe('Gateway proxy request body forwarding', () => {
  test.each(['POST', 'PUT', 'PATCH'])('forwards parsed %s JSON bodies and preserves other headers', (method) => {
    const body = { message: 'hello', count: 1 };
    const bodyData = JSON.stringify(body);
    const headers = {
      'content-type': 'application/json',
      authorization: 'Bearer test-token',
      'x-request-id': 'request-123',
    };
    const req = { method, body, headers };
    const proxyReq = createProxyRequest(headers);

    proxyRequestHook(proxyReq, req);

    expect(proxyReq.write).toHaveBeenCalledTimes(1);
    expect(proxyReq.write).toHaveBeenCalledWith(bodyData);
    expect(proxyReq.headers['content-type']).toBe('application/json');
    expect(proxyReq.headers['content-length']).toBe(Buffer.byteLength(bodyData));
    expect(proxyReq.headers.authorization).toBe(headers.authorization);
    expect(proxyReq.headers['x-request-id']).toBe(headers['x-request-id']);
  });
});

describe('Gateway proxy error responses', () => {
  test('returns a generic error and logs proxy details server-side', () => {
    const proxyErrorHandler = mockProxyOptions[0].on.error;
    const proxyError = Object.assign(new Error('internal proxy diagnostic'), {
      code: 'ECONNREFUSED',
    });
    const response = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      proxyErrorHandler(proxyError, {}, response);

      expect(response.status).toHaveBeenCalledWith(503);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        message: 'A downstream service is currently unavailable. Please try again shortly.',
      });
      expect(JSON.stringify(response.json.mock.calls[0][0])).not.toContain(proxyError.message);
      expect(JSON.stringify(response.json.mock.calls[0][0])).not.toContain(proxyError.code);
      expect(errorLog).toHaveBeenCalledWith(
        '[api-gateway] Error proxying to auth-service:',
        { code: proxyError.code, message: proxyError.message }
      );
    } finally {
      errorLog.mockRestore();
    }
  });
});
