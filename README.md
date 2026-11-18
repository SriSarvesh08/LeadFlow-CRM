# LeadFlow CRM - Backend Infrastructure

LeadFlow CRM is organized as a set of independently run Node.js/Express services behind an API Gateway. This document covers the current backend infrastructure: service setup, database configuration, shared middleware/utilities, health checks, and Postman files. It does not describe unimplemented service features.

## Technology

- Node.js and Express
- MySQL for Auth, Customers, and Sales
- MongoDB for Leads, Activity, Support, and Notification
- Express API Gateway with HTTP proxying
- JWT authentication and shared backend utilities
- Jest and Supertest where service tests are present
- Postman collection and local environment

Use Node.js 20 or newer. The Auth service's declared Nodemailer dependency requires Node.js 20 or newer.

## Repository layout

```text
LeadFlow-CRM/
├── gateway/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── shared/
│   ├── AppError.js
│   ├── corsOptions.js
│   ├── errorHandler.js
│   ├── logger.js
│   ├── responseHelper.js
│   ├── index.js
│   └── package.json
├── services/
│   ├── auth-service/
│   ├── customers-service/
│   ├── sales-service/
│   ├── leads-service/
│   ├── activity-service/
│   ├── support-service/
│   └── notification-service/
├── database/
│   ├── mysql/
│   │   ├── 01_crm_auth.sql
│   │   ├── 02_crm_customers.sql
│   │   ├── 03_crm_sales.sql
│   │   └── 04_indexes.sql
│   └── seed/
│       └── mysql_seed_mariadb.sql
├── postman/
│   ├── LeadFlow-CRM.postman_collection.json
│   └── LeadFlow-CRM-Local.postman_environment.json
├── .env.example
├── package.json
└── README.md
```

Each service has its own `package.json`, `package-lock.json`, `src/`, and `.env.example`. The root package provides convenience start/development scripts; it does not declare application dependencies or npm workspaces.

## Prerequisites

- Node.js 20 or newer and npm
- MySQL or MariaDB for Auth, Customers, and Sales
- MongoDB for Leads, Activity, Support, and Notification
- Postman for manual API testing

## Install dependencies

Services are installed independently. From the repository root, install each package's dependencies:

```sh
npm install --prefix shared
npm install --prefix gateway
npm install --prefix services/auth-service
npm install --prefix services/customers-service
npm install --prefix services/sales-service
npm install --prefix services/leads-service
npm install --prefix services/activity-service
npm install --prefix services/support-service
npm install --prefix services/notification-service
```

The root `package.json` has no runtime or development dependencies, so `npm install` at the root is not a substitute for installing the service packages.

## Dependency security and registry notes

The current npm audit reported **0 critical, 0 high, 27 moderate, and 42 low findings** across the root, Gateway, and seven service projects. These are per-project package counts and include repeated reports for transitive dependency chains; they are not counts of unique advisories.

Previously identified Auth bcrypt/tar exposure was addressed by upgrading Auth to `bcrypt@6.0.0`. The unused Nodemailer dependency was removed from Notification. These fixes do not resolve the remaining findings:

- **Production, moderate:** affected UUID versions remain in dependency chains through Sequelize and `node-cron`. The available UUID fix is outside the locked parent dependency ranges; major parent upgrades or overrides require compatibility testing.
- **Development, moderate:** Nodemon depends on an affected minimatch version. The patched minimatch major version is outside Nodemon's declared range.
- **Development, low:** Jest's dependency chain includes affected `deepmerge`; no patched release was available in the reviewed registry metadata.
- **Development deprecations:** Jest's transitive dependency tree includes deprecated `glob` and `inflight`. These are deprecation notices, not additional confirmed findings in the reported audit totals.

Treat the unresolved advisories as risks to monitor or document until compatible upstream fixes are available; do not assume a forced override or major upgrade is safe.

Service lockfiles currently record package tarball URLs from `registry.npmmirror.com` (Auth also contains some `registry.npmjs.org` URLs). No repository `.npmrc` was found, so the repository does not establish whether use of the mirror is intentional. Confirm the expected registry with maintainers before regenerating lockfiles.

## Environment configuration

Use `.env.example` files as templates; do not commit local `.env` files or copy example credentials into production. Real `.env` files are excluded from Git via `.gitignore`.

### Root Environment Setup
To prepare the root environment configuration for Docker Compose or local coordination:

```sh
cp .env.example .env
```

The root `.env.example` provides centralized placeholders for:
- Gateway server port (`PORT=5000`), CORS origins, and rate limits (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`).
- Internal service URLs (`AUTH_SERVICE_URL`, `LEADS_SERVICE_URL`, etc.).
- Standalone local database connections (`DB_HOST`, `DB_PORT`, `MONGO_URI_*`).
- Docker Compose database accounts and credentials (`MYSQL_ROOT_PASSWORD`, `DB_USER_*`, `MONGO_ROOT_*`, `MONGO_*_USER`).
- Authentication secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_RESET_SECRET`).
- Inter-service communication security (`INTERNAL_SERVICE_KEY`).
- Notification SMTP configurations (`SMTP_HOST`, `SMTP_PORT`, etc.).

### Precedence and Per-Service Configuration
- The Gateway server and app load `gateway/.env`; use `gateway/.env.example`. The Gateway listens on `PORT` (default `5000`).
- `gateway/src/config/services.js` separately loads the repository-root `.env` for downstream service URLs such as `AUTH_SERVICE_URL` and `LEADS_SERVICE_URL`. During normal Gateway startup, the Gateway server loads `gateway/.env` before the app loads this service configuration. `dotenv` does not overwrite variables already present, so existing process environment values take precedence, followed by values loaded from `gateway/.env`; root `.env` values fill only variables that remain unset.
- Each service loads its own configuration from that service's `.env`; use its corresponding service `.env.example`.
- Configure browser origins through `FRONTEND_URL` and optional comma-separated `CORS_ALLOWED_ORIGINS`. Only explicitly configured origins are allowed.

The Auth service uses SMTP configuration for password-reset email delivery. The Notification service example also contains SMTP variables, but its current source does not implement Nodemailer email sending.

## Services and ports

The following are the default ports and database mappings across the eight backend services:

| Component | Default port | Database Engine | Database Name | Startup Dependency |
|---|---:|---|---|---|
| API Gateway | 5000 | None | N/A | None (starts independently) |
| Auth Service | 5001 | MySQL | `crm_auth` | Requires live MySQL |
| Leads Service | 5002 | MongoDB | `crm_leads` | Requires live MongoDB |
| Customers Service | 5003 | MySQL | `crm_customers` | Requires live MySQL |
| Sales Service | 5004 | MySQL | `crm_sales` | Requires live MySQL |
| Activity Service | 5005 | MongoDB | `crm_activity` | Requires live MongoDB |
| Support Service | 5006 | MongoDB | `crm_support` | Requires live MongoDB |
| Notification Service | 5007 | MongoDB | `crm_notify` | Requires live MongoDB |

The Gateway forwards API requests under `/api` to configured downstream service URLs. Direct service URLs are also available for local health checks and debugging.

## Database and lifecycle

### Database Dependencies
- **MySQL 8.4:** Used by Auth, Customers, and Sales. Schema definitions are located in `database/mysql/01_crm_auth.sql`, `database/mysql/02_crm_customers.sql`, and `database/mysql/03_crm_sales.sql`; shared indexes are in `database/mysql/04_indexes.sql`. The MariaDB seed script is `database/seed/mysql_seed_mariadb.sql`.
- **MongoDB 8.0:** Used by Leads, Activity, Support, and Notification. URIs are configured per service via `MONGO_URI`.

### Service Startup Behavior
Each of the seven microservices verifies its database connection before listening for HTTP requests (`server.js` executes `await testConnection()` for MySQL or `await connectDB()` for MongoDB). If the required database connection cannot be established, service startup is immediately aborted (`process.exit(1)`). On graceful shutdown, services close the HTTP server and attempt to disconnect from their respective database.

> [!IMPORTANT]
> All seven microservices strictly require live, accessible database connections to start. Live database connectivity inside Docker containers has not yet been verified, as database initialization scripts (automated user creation and schema mounting) are pending database developer hand-off.

## Docker Compose infrastructure

Docker Compose orchestrates the API Gateway, the seven microservices, and dedicated MySQL and MongoDB containers over an isolated bridge network (`backend`).

### Starting the Infrastructure
To build container images and start all backend services:

```sh
docker compose up --build -d
```

To stop all running containers:

```sh
docker compose down
```

### Checking Container Status and Health
All services and databases include container healthchecks. Monitor status using:

```sh
# View running containers, port bindings, and health state
docker compose ps

# View logs for a specific service
docker compose logs -f gateway
docker compose logs -f auth-service

# Inspect detailed healthcheck results for a container
docker inspect --format='{{json .State.Health}}' leadflow-crm-gateway-1
```

> [!NOTE]
> Database volumes (`mysql-data`, `mongodb-data`) persist data across container restarts. Do not delete or prune volumes unless a clean slate is explicitly required.

## Running services locally

To run an individual service standalone from its package directory:

```sh
cd services/auth-service
npm start
```

Start the Gateway from `gateway/` with `npm start`. Local environment configuration and running database servers must be set up beforehand.

Convenience root scripts are also available:

```sh
npm run start:gateway
npm run start:auth
npm run start:leads
npm run start:customers
npm run start:sales
npm run start:activity
npm run start:support
npm run start:notifications
```

Matching `dev:*` scripts are available for development, for example `npm run dev:gateway` and `npm run dev:auth`.

## Health checks

Each service and the API Gateway exposes `GET /health`:

| Component | Health URL |
|---|---|
| API Gateway | `http://localhost:5000/health` |
| Auth Service | `http://localhost:5001/health` |
| Leads Service | `http://localhost:5002/health` |
| Customers Service | `http://localhost:5003/health` |
| Sales Service | `http://localhost:5004/health` |
| Activity Service | `http://localhost:5005/health` |
| Support Service | `http://localhost:5006/health` |
| Notification Service | `http://localhost:5007/health` |

### Health Check Response Structure
All eight endpoints return an HTTP `200 OK` with a standardized JSON payload:

```json
{
  "success": true,
  "service": "api-gateway",
  "status": "operational",
  "port": 5000,
  "timestamp": "2026-11-15T18:00:00.000Z"
}
```

- `success`: Boolean indicating successful processing.
- `service`: Identifier string of the responding service.
- `status`: Always `"operational"` when the HTTP server process is responsive.
- `port`: Port number on which the service is configured to listen.
- `timestamp`: ISO 8601 UTC timestamp of the health probe.

This probe verifies process liveness and HTTP stack availability; it does not perform deep database table queries.

## CORS and Gateway

CORS options are provided by `shared/corsOptions.js` and exported by `shared/index.js`. Set `FRONTEND_URL` and, if needed, `CORS_ALLOWED_ORIGINS` in the relevant Gateway/service environment. The Gateway also applies authentication, IP rate limiting (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`), and proxies requests to configured downstream services.

Service route implementations vary. Customers, Sales, Activity, Support, and Notification currently expose their health route from `src/app.js`; do not infer business endpoints from Gateway proxy mappings alone.

## Postman

Import these files from `postman/`:

- `LeadFlow-CRM.postman_collection.json`
- `LeadFlow-CRM-Local.postman_environment.json`

Select the local environment and verify its direct service URLs and Gateway URL. Populate token variables only when testing protected requests. The collection contains 36 requests in three folders:

- **Health Checks (Week 1):** six checks for Customers, Sales, Activity, Support, Notification, and the API Gateway.
- **Auth Service (Week 2):** 18 requests, including the direct Auth health check.
- **Leads Service (Week 4):** 12 requests, including the direct Leads health check.

## Tests

### Offline Tests vs. Live Service Startup
There is an important distinction between test execution and runtime service startup:
- **Offline Tests (`app.js`):** Jest test suites import `src/app.js` directly using Supertest. Database connection logic is mocked (`jest.mock('../src/config/db')`, `jest.mock('mongoose')`), and `src/server.js` is not executed. All tests run completely offline and verify route handling, middleware, and response contracts without requiring live MySQL or MongoDB instances.
- **Live Service Startup (`server.js`):** When launching services with `npm start` or Docker Compose, `server.js` executes and blocks on `await testConnection()` (MySQL) or `await connectDB()` (MongoDB). Without reachable database instances, services exit with code 1. Offline test success confirms code and route contracts, but does not prove live database connectivity or full runtime startup.

### Running Tests Across All Eight Modules
All eight backend services have Jest test suites (totaling 16 test suites and 100 tests):

```sh
# 1. API Gateway (4 suites, 20 tests: auth proxy, routing, CORS, shutdown)
npm test --prefix gateway

# 2. Auth Service (6 suites, 68 tests: auth, RBAC, controllers, email, lifecycle)
npm test --prefix services/auth-service

# 3. Leads Service (1 suite, 2 tests: baseline health and route liveness)
npm test --prefix services/leads-service

# 4. Customers Service (1 suite, 2 tests: baseline health and route liveness)
npm test --prefix services/customers-service

# 5. Sales Service (1 suite, 2 tests: baseline health and route liveness)
npm test --prefix services/sales-service

# 6. Activity Service (1 suite, 2 tests: baseline health and route liveness)
npm test --prefix services/activity-service

# 7. Support Service (1 suite, 2 tests: baseline health and route liveness)
npm test --prefix services/support-service

# 8. Notification Service (1 suite, 2 tests: baseline health and route liveness)
npm test --prefix services/notification-service
```
