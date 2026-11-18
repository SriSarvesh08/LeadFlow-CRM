const createCorsOptions = (environment = process.env) => {
  const allowedOrigins = new Set([
    environment.FRONTEND_URL,
    ...(environment.CORS_ALLOWED_ORIGINS || '').split(','),
  ].filter((origin) => typeof origin === 'string')
    .map((origin) => origin.trim())
    .filter(Boolean));

  return {
    origin: (origin, callback) => callback(null, Boolean(origin && allowedOrigins.has(origin))),
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['x-total-count'],
  };
};

module.exports = createCorsOptions;
