const environmentKeys = ['JWT_SECRET', 'PORT', 'NODE_ENV'];
const originalEnvironment = Object.fromEntries(
  environmentKeys.map((key) => [key, process.env[key]])
);

describe('Gateway graceful shutdown', () => {
  let app;
  let server;
  let signalHandlers;
  let processOnceSpy;
  let exitSpy;
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_SECRET = 'gateway-test-secret';
    process.env.PORT = '5000';
    process.env.NODE_ENV = 'test';
    signalHandlers = {};
    server = {
      close: jest.fn((callback) => callback()),
    };
    app = {
      listen: jest.fn(() => server),
    };

    jest.doMock('dotenv', () => ({ config: jest.fn() }));
    jest.doMock('../src/app', () => app);

    const originalProcessOnce = process.once;
    processOnceSpy = jest.spyOn(process, 'once').mockImplementation((signal, handler) => {
      if (signal === 'SIGTERM' || signal === 'SIGINT') {
        signalHandlers[signal] = handler;
        return process;
      }
      return originalProcessOnce.call(process, signal, handler);
    });
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    jest.isolateModules(() => {
      app = require('../src/server');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.dontMock('dotenv');
    jest.dontMock('../src/app');
    jest.resetModules();
    environmentKeys.forEach((key) => {
      if (originalEnvironment[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnvironment[key];
      }
    });
  });

  test('exits successfully after closing the HTTP server once', () => {
    app.startGateway();

    expect(processOnceSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(processOnceSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));

    signalHandlers.SIGTERM();
    signalHandlers.SIGINT();

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('[api-gateway] Gateway server closed.');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs HTTP close error details and exits unsuccessfully', () => {
    app.startGateway();
    const closeError = Object.assign(new Error('listener close failed'), {
      code: 'ERR_SERVER_NOT_RUNNING',
    });
    server.close.mockImplementationOnce((callback) => callback(closeError));

    signalHandlers.SIGTERM();

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith('[api-gateway] Error closing Gateway server:', {
      code: closeError.code,
      message: closeError.message,
    });
    expect(logSpy).not.toHaveBeenCalledWith('[api-gateway] Gateway server closed.');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
