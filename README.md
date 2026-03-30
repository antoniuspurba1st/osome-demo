# Osome Demo Backend

Production-like backend service built with Node.js, TypeScript, AWS SAM, PostgreSQL, and Jest.

## Project Status

Current progress:

1. Phase 1 - Foundation: done
2. Phase 2 - Core Backend: done
3. Phase 3 - Reliability: done
4. Phase 4 - Production Readiness: done
5. Phase 5 - Deployment / DevOps: mostly done

What is already working:

- TypeScript project setup
- AWS SAM template for local/serverless execution
- `GET /health`
- `GET /ready`
- `GET /users`
- `POST /users`
- PostgreSQL connection pooling with `pg`
- Joi request validation
- Pino JSON logging
- request / correlation ID per request
- global error handling
- `helmet`, `cors`, and `express-rate-limit`
- Jest unit tests for health and users endpoints
- environment loading from `.env`, `.env.local`, and `.env.production`

Current notes:

- `sam build` is working
- `sam local start-api` is configured through `template.yaml`
- local non-SAM development is available with `npm run dev`
- PostgreSQL must already be installed and running locally

## Tech Stack

- Node.js
- TypeScript
- Express
- AWS SAM
- PostgreSQL
- `pg`
- Joi
- Pino
- Jest

## Quick Start

```bash
npm install
```

```powershell
$env:PGPASSWORD='your_password'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h 127.0.0.1 -U postgres -d postgres -f .\scripts\init.sql
```

```bash
npm run dev
```

```powershell
curl.exe http://localhost:3000/health
```

## Requirement Coverage Checklist

| Requirement | Status | Notes |
| --- | --- | --- |
| TypeScript strict mode | Implemented | Strict compiler settings are enabled in `tsconfig.json`. |
| Express API | Implemented | REST endpoints are exposed through Express handlers. |
| PostgreSQL connection pooling | Implemented | Uses `pg` `Pool` in `src/db/pool.ts`. |
| Health endpoint | Implemented | `GET /health` returns service health and `requestId`. |
| Readiness endpoint | Implemented | `GET /ready` verifies database connectivity with `SELECT 1`. |
| Request ID middleware | Implemented | Generates or reuses request correlation IDs per request. |
| Structured logging | Implemented | JSON logs are emitted using Pino. |
| Global error handler | Implemented | Centralized JSON error responses are handled in middleware. |
| Validation using Joi | Implemented | `POST /users` validates input before persistence. |
| Environment configuration | Implemented | Uses `.env`, `.env.local`, and `.env.production`. |
| Security middleware | Implemented | `helmet` and `cors` are enabled in the Express app. |
| Rate limiting | Implemented | `express-rate-limit` is configured for 100 requests per minute. |
| Unit testing | Implemented | Jest covers health and users endpoint behavior. |
| AWS SAM support | Implemented | `template.yaml` defines Lambda-compatible API functions. |
| Local development workflow | Implemented | Local run is available through `npm run dev`. |
| Type checking | Implemented | `npm run typecheck` is verified and passing. |
| Production logging | Implemented | Logs include method, path, status, duration, and request ID. |

## Architecture Overview

This service follows a simple layered backend structure designed for maintainability and clear responsibility boundaries.

- Client requests enter through the Express application.
- Route handlers act as the controller layer and map HTTP requests to business actions.
- Repository modules isolate database access and SQL interaction.
- PostgreSQL is used as the persistence layer.
- Shared concerns such as logging, validation, request correlation, security middleware, and error handling are applied centrally.

Cross-cutting concerns:

- Logging is applied per request using structured JSON output.
- Validation is performed before persistence for incoming user payloads.
- Error handling is centralized so responses remain consistent.
- Request ID correlation is added to responses and logs.
- Security middleware applies headers, CORS, and rate limiting at the application boundary.

```text
Client
  ↓
Express
  ↓
Handlers
  ↓
Repositories
  ↓
PostgreSQL
```

## Design Decisions

- PostgreSQL: chosen for its reliability, transactional consistency, and strong fit for structured backend data.
- TypeScript: used to improve type safety, refactoring confidence, and long-term maintainability.
- Joi: provides clear request validation with readable schema definitions close to the handler layer.
- Pino: chosen for fast structured logging that is suitable for local debugging and production-style log aggregation.
- AWS SAM: keeps the project compatible with serverless deployment while still allowing a practical local workflow.

## Folder Structure

```text
.
├─ scripts/
│  └─ init.sql
├─ src/
│  ├─ config/
│  │  └─ env.ts
│  ├─ db/
│  │  ├─ pool.ts
│  │  └─ userRepository.ts
│  ├─ handlers/
│  │  ├─ health.ts
│  │  ├─ ready.ts
│  │  └─ users.ts
│  ├─ middleware/
│  │  ├─ errorHandler.ts
│  │  └─ logger.ts
│  ├─ tests/
│  │  ├─ health.test.ts
│  │  └─ users.test.ts
│  ├─ types/
│  │  └─ express/
│  │     └─ index.d.ts
│  ├─ utils/
│  │  ├─ httpError.ts
│  │  └─ requestId.ts
│  ├─ app.ts
│  ├─ lambda.ts
│  └─ server.ts
├─ .env
├─ .env.example
├─ .env.local
├─ .env.production
├─ jest.config.js
├─ package.json
├─ template.yaml
└─ tsconfig.json
```

## Environment Variables

Example values:

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123123
DB_NAME=osome_demo
LOG_LEVEL=info
```

Important:

- `.env.local` overrides `.env`
- make sure `DB_PASSWORD` matches your actual local PostgreSQL password

## Database Setup

Create the database and table using:

```powershell
$env:PGPASSWORD='your_password'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h 127.0.0.1 -U postgres -d postgres -f .\scripts\init.sql
```

Expected schema:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  response_body JSONB NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Database Schema Updates

Recent schema additions:

- `users.status`: lifecycle state column with default value `pending`
- `idempotency_keys`: stores idempotency keys, stored response bodies, and status codes
- `audit_logs`: stores structured records for important system actions

These updates support workflow enforcement, retry-safe writes, and production traceability.

## Install

```bash
npm install
```

## Run Locally

Non-SAM local development:

```bash
npm run dev
```

Build TypeScript:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Run with AWS SAM:

```bash
sam build
sam local start-api
```

## API Endpoints

### `GET /health`

Response:

```json
{
  "status": "ok",
  "requestId": "uuid"
}
```

### `GET /ready`

Response when DB is reachable:

```json
{
  "status": "ready",
  "requestId": "uuid"
}
```

Response when DB is unavailable:

```json
{
  "error": "Database unavailable",
  "requestId": "uuid"
}
```

### `POST /users`

Request:

```json
{
  "name": "John",
  "email": "john@mail.com"
}
```

Response:

```json
{
  "id": 1,
  "name": "John",
  "email": "john@mail.com"
}
```

### `GET /users`

Response:

```json
[
  {
    "id": 1,
    "name": "John",
    "email": "john@mail.com"
  }
]
```

### `PATCH /users/:id/status`

Used to change a user status according to workflow transition rules.

Response:

```json
{
  "id": 1,
  "status": "active"
}
```

## User Workflow

Users now have a lifecycle state managed by the API.

Available statuses:

- `pending`
- `active`
- `inactive`

Allowed transitions:

- `pending -> active`
- `active -> inactive`

Invalid transitions return:

- `HTTP 400 Bad Request`

Example:

`PATCH /users/1/status`

Request:

```json
{
  "status": "active"
}
```

Response:

```json
{
  "id": 1,
  "status": "active"
}
```

All status changes are logged and written to the audit log.

## Idempotency

`POST /users` supports idempotent requests using the `Idempotency-Key` header.

Purpose:

- Prevent duplicate user creation during client retries.

Behavior:

- If the same `Idempotency-Key` is reused, the API returns the previously stored response.
- No new user is created for the repeated request.
- Requests are handled transactionally.

Example:

`POST /users`

Header:

```text
Idempotency-Key: abc123
```

Related database table:

- `idempotency_keys`

## Background Jobs

Certain operations run asynchronously after the request has completed.

Current background task:

- welcome email notification after user creation

Important behavior:

- The API response is returned immediately.
- The background job runs after the response is sent.

This keeps request latency low and improves responsiveness under retry and workflow-driven traffic.

## Audit Logging

Critical actions are recorded in an audit log.

Tracked events:

- `user_created`
- `status_changed`

Audit logging is best-effort.

- If audit log persistence fails, the main request still succeeds.

Related database table:

- `audit_logs`

Purpose:

- Traceability
- Debugging
- Compliance

## Graceful Shutdown

The service supports graceful shutdown behavior.

When the process receives a termination signal, the service:

- stops accepting new requests
- closes the HTTP server
- closes the PostgreSQL connection pool

Purpose:

- prevent resource leaks
- ensure safe deployment and restart behavior

## Error Handling

Errors are returned consistently across the API.

- All error responses are JSON.
- Every error response includes `requestId`.
- No HTML error pages are returned.
- HTTP status codes are preserved.
- Errors are logged through the centralized error middleware.

Example:

```json
{
  "error": "User not found",
  "requestId": "uuid"
}
```

## Sample Commands

Health check:

```powershell
curl.exe http://localhost:3000/health
```

Ready check:

```powershell
curl.exe http://localhost:3000/ready
```

Create user from PowerShell:

```powershell
curl.exe -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"John","email":"john@mail.com"}'
```

List users:

```powershell
curl.exe http://localhost:3000/users
```

## Logging

The service uses Pino JSON logging with:

- `requestId`
- `method`
- `path`
- `status`
- `duration`

Example:

```json
{
  "level": 30,
  "requestId": "uuid",
  "method": "GET",
  "path": "/health",
  "status": 200,
  "duration": 3
}
```

## Logging Details

The logging layer is designed for operational clarity and traceability.

- Logging is implemented using Pino.
- Output is structured as JSON.
- Each request log includes `method`, `path`, `status`, `duration`, and `requestId`.
- Error logs include the same request correlation context to simplify troubleshooting.

Example request log:

```json
{
  "level": 30,
  "requestId": "0c9b5f3d-6b55-4c9a-97d7-f5d2f5b1d0be",
  "method": "POST",
  "path": "/users",
  "status": 201,
  "duration": 12
}
```

## Testing Status

Currently covered:

- health endpoint
- users create endpoint
- users list endpoint
- users validation error path

## SAM Resources

Defined in `template.yaml`:

- `HealthFunction`
- `UsersFunction`

## Known Constraints

- `sam local start-api` depends on the local SAM runtime setup
- local PostgreSQL must be running
- if `.env.local` contains outdated DB credentials, `/ready` and `/users` will fail

## Troubleshooting

### Port already in use

Error:

```text
Error: listen EADDRINUSE: address already in use :::3000
```

Fix:

```powershell
netstat -ano | Select-String ':3000'
Stop-Process -Id <PID> -Force
```

Then start the service again:

```bash
npm run dev
```

### Database connection failed

Error:

```text
{"error":"Database unavailable","requestId":"uuid"}
```

Fix:

- Confirm PostgreSQL is running on `127.0.0.1:5432`.
- Check that `.env.local` does not override valid credentials from `.env`.
- Verify the target database exists.

Helpful check:

```powershell
$env:PGPASSWORD='your_password'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h 127.0.0.1 -U postgres -d osome_demo -c "SELECT 1;"
```

### SAM build failure

Error:

```text
Error: NodejsNpmEsbuildBuilder:EsbuildBundle - Esbuild Failed
```

Fix:

- Run `npm install` to ensure project dependencies are installed.
- Confirm `esbuild` is available in project dependencies.
- Re-run the build:

```bash
sam build
```

### Nodemon not restarting

Error:

```text
Changes are made but the server does not restart automatically
```

Fix:

- Stop the current process and run `npm run dev` again.
- Confirm the command is being started through the project script.
- If needed, remove stale Node processes before restarting:

```powershell
Get-Process node
Stop-Process -Id <PID> -Force
```

Then:

```bash
npm run dev
```

## Production Readiness

- Structured JSON logging using Pino for machine-readable operational output.
- Request ID correlation for tracing a request across handlers and logs.
- Centralized global error handling with consistent JSON responses.
- Input validation using Joi before database access.
- Rate limiting to protect the API from abusive request bursts.
- Security middleware through `helmet` and `cors`.
- Health checks for service liveness.
- Readiness checks for dependency verification against PostgreSQL.
- Environment-based configuration for local and production-like setups.
- Type safety through TypeScript strict compilation.
- Unit testing for key endpoint behavior.
- Serverless compatibility through AWS SAM and Lambda handler wiring.
- Workflow state transitions for controlled user lifecycle changes.
- Idempotent request handling for retry-safe user creation.
- Background job processing for non-blocking asynchronous work.
- Audit logging for important business actions.
- Graceful shutdown for safe stop and restart behavior.

## Next Improvements

- add migration tooling for schema management
- add repository/service layering for larger domain growth
- add integration tests against a real database
- add authentication and authorization
- add unique constraint on `email`

## Future Improvements

- idempotency support for write operations
- pagination for collection endpoints
- database migrations for repeatable schema changes
- graceful shutdown for active connections and in-flight requests
- metrics for request rates, errors, and latency
- OpenAPI documentation for contract visibility
- CI/CD pipeline for automated test and build validation
- Docker support for more portable local environments
