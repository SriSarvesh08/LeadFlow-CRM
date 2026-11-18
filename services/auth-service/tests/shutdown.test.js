const environmentKeys = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET', 'INTERNAL_SERVICE_KEY'];
const originalEnvironment = Object.fromEntries(
  environmentKeys.map((key) => [key, process.env[key]])
);

const mockClose = jest.fn((cb) => cb());
const mockApp = {
  listen: jest.fn((port, cb) => {
    if (cb) cb();
    return { close: mockClose };
  }),
};
const mockSequelizeClose = jest.fn().mockResolvedValue();
const mockTestConnection = jest.fn().mockResolvedValue(true);

jest.mock('../src/app', () => mockApp);
jest.mock('../src/config/db', () => ({
  sequelize: { close: mockSequelizeClose },
  testConnection: mockTestConnection,
}));

describe('Auth Service — Graceful Shutdown', () => {
  let exitSpy;
  let logSpy;
  let errSpy;
  let processOnceSpy;
  let signalHandlers;

  beforeEach(() => {
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'crm_auth';
    process.env.DB_USER = 'root';
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.INTERNAL_SERVICE_KEY = 'test_internal_key';
    signalHandlers = {};
    jest.resetModules();
    jest.clearAllMocks();
    const originalProcessOnce = process.once;
    processOnceSpy = jest.spyOn(process, 'once').mockImplementation((signal, handler) => {
      if (signal === 'SIGTERM' || signal === 'SIGINT') {
        signalHandlers[signal] = handler;
        return process;
      }
      return originalProcessOnce.call(process, signal, handler);
    });
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockClose.mockImplementation((cb) => cb());
    mockSequelizeClose.mockResolvedValue();
    mockTestConnection.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    environmentKeys.forEach((key) => {
      if (originalEnvironment[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnvironment[key];
      }
    });
  });

  test('SIGTERM closes HTTP server and Sequelize once, and ignores duplicate SIGINT', async () => {
    const serverApp = require('../src/server');
    await serverApp.startServer();

    await signalHandlers.SIGTERM();
    await signalHandlers.SIGINT();

    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockSequelizeClose).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('Handles sequelize.close() error safely without exposing secrets', async () => {
    mockSequelizeClose.mockRejectedValueOnce(new Error('Pool close timeout'));
    const serverApp = require('../src/server');
    await serverApp.startServer();

    await signalHandlers.SIGINT();

    expect(mockSequelizeClose).toHaveBeenCalledTimes(1);
    expect(errSpy).toHaveBeenCalledWith('[auth-service] Error closing MySQL connection: Pool close timeout');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
