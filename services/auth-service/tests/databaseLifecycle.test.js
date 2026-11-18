const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');
const servicesRoot = path.join(repoRoot, 'services');
const services = [
  { name: 'auth-service', database: 'mysql' },
  { name: 'customers-service', database: 'mysql' },
  { name: 'sales-service', database: 'mysql' },
  { name: 'leads-service', database: 'mongodb' },
  { name: 'activity-service', database: 'mongodb' },
  { name: 'notification-service', database: 'mongodb' },
  { name: 'support-service', database: 'mongodb' },
];
const mockedModules = new Set();

const loadService = ({ name, database }, events = []) => {
  const serviceRoot = path.join(servicesRoot, name);
  const serverPath = path.join(serviceRoot, 'src', 'server.js');
  const appPath = path.join(serviceRoot, 'src', 'app.js');
  const dbPath = path.join(serviceRoot, 'src', 'config', 'db.js');
  const server = {
    close: jest.fn((callback) => {
      events.push('http-close');
      callback();
    }),
  };
  const app = {
    listen: jest.fn((port, callback) => {
      events.push('listen');
      callback();
      return server;
    }),
  };
  const connect = jest.fn(() => {
    events.push('database-check');
    return Promise.resolve(database === 'mysql' ? true : { connection: {} });
  });
  const databaseClose = jest.fn(() => {
    events.push('database-close');
    return Promise.resolve();
  });
  const mongoose = { connection: { close: databaseClose } };
  const dotenvPath = require.resolve('dotenv', { paths: [serviceRoot] });

  jest.resetModules();
  jest.doMock(dotenvPath, () => ({
    config: jest.fn(),
  }));
  mockedModules.add(dotenvPath);
  jest.doMock(appPath, () => app);
  mockedModules.add(appPath);

  if (database === 'mysql') {
    jest.doMock(dbPath, () => ({
      sequelize: { close: databaseClose },
      testConnection: connect,
    }));
  } else {
    const mongoosePath = require.resolve('mongoose', { paths: [serviceRoot] });
    jest.doMock(mongoosePath, () => mongoose);
    mockedModules.add(mongoosePath);
    jest.doMock(dbPath, () => connect);
  }
  mockedModules.add(dbPath);

  return {
    app: require(serverPath),
    connect,
    databaseClose,
    server,
  };
};

describe.each(services)('$name database connection lifecycle', (service) => {
  let exit;
  let processOnce;
  let signalHandlers;
  let originalProcessOnce;

  beforeEach(() => {
    signalHandlers = {};
    originalProcessOnce = process.once;
    processOnce = jest.spyOn(process, 'once').mockImplementation((signal, handler) => {
      if (signal === 'SIGINT' || signal === 'SIGTERM') {
        signalHandlers[signal] = handler;
        return process;
      }
      return originalProcessOnce.call(process, signal, handler);
    });
    exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockedModules.forEach((modulePath) => jest.dontMock(modulePath));
    mockedModules.clear();
    jest.resetModules();
  });

  test('waits for the database connection check before listening', async () => {
    const events = [];
    let resolveConnection;
    const { app, connect } = loadService(service, events);
    connect.mockImplementationOnce(() => {
      events.push('database-check');
      return new Promise((resolve) => {
        resolveConnection = resolve;
      });
    });

    const startPromise = app.startServer();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(app.listen).not.toHaveBeenCalled();

    resolveConnection(service.database === 'mysql' ? true : { connection: {} });
    await startPromise;

    expect(events).toEqual(['database-check', 'listen']);
    expect(app.listen).toHaveBeenCalledTimes(1);
  });

  test('does not listen and exits unsuccessfully when the database check fails', async () => {
    const { app, connect } = loadService(service);
    connect.mockRejectedValueOnce(new Error('database unavailable'));

    await app.startServer();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(app.listen).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });

  test('closes the database connection after the HTTP server on shutdown', async () => {
    const events = [];
    const { app, databaseClose, server } = loadService(service, events);
    await app.startServer();

    expect(processOnce).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    await signalHandlers.SIGTERM();

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(databaseClose).toHaveBeenCalledTimes(1);
    expect(events.slice(-3)).toEqual(['listen', 'http-close', 'database-close']);
    expect(exit).toHaveBeenCalledWith(0);
  });

  test('attempts database closure and exits unsuccessfully when HTTP server closure fails', async () => {
    const events = [];
    const { app, databaseClose, server } = loadService(service, events);
    await app.startServer();
    server.close.mockImplementationOnce((callback) => {
      events.push('http-close');
      callback(new Error('HTTP close failed'));
    });

    await signalHandlers.SIGTERM();

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(databaseClose).toHaveBeenCalledTimes(1);
    expect(events.slice(-2)).toEqual(['http-close', 'database-close']);
    expect(exit).toHaveBeenCalledWith(1);
  });

  test('exits unsuccessfully when database closure fails', async () => {
    const { app, databaseClose, server } = loadService(service);
    await app.startServer();
    databaseClose.mockRejectedValueOnce(new Error('database close failed'));

    await signalHandlers.SIGTERM();

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(databaseClose).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(1);
  });
});
