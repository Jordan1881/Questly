# Questly API Reference

Base URL: `http://localhost:3001` (dev) or Railway production URL.

Authentication: `Authorization: Bearer <JWT>` unless noted.

## Conventions

### Versioning

Every route is served under both `/api/*` and the explicit version alias `/api/v1/*`
(identical today). A future backward-incompatible change ships under `/api/v2` while
`/api` and `/api/v1` keep serving the current contract, so existing clients never break.
This is why the app mounts the same router twice in [`server/app.js`](../server/app.js).

### HTTP verbs

| Verb | Meaning in Questly |
|------|--------------------|
| GET | Read; never mutates state |
| POST | Create a resource or trigger an action (`/sync`, `/close`, `/purchase`) |
| PATCH | Partial update of an existing resource (we deliberately use PATCH over PUT — clients send only changed fields, e.g. task completion or a sprint rename) |
| DELETE | Remove/disconnect a resource |

PUT is intentionally unused: all updates are partial, so PATCH matches the semantics.

### Status codes

`200` OK · `201` Created · `400` validation error · `401` missing/invalid token ·
`403` authenticated but not allowed (role/workspace) · `404` not found ·
`409` conflict (duplicate completion, duplicate active sprint) · `503` external
dependency (Jira) unavailable. Errors always return `{ "error": "<message>" }`
via the central handler in [`server/middleware/errorHandler.js`](../server/middleware/errorHandler.js).

### DTOs

Responses never expose raw DB rows. Each resource has a formatter that maps
snake_case columns to a stable camelCase shape and drops internal/secret columns
(`formatTask` in [`server/controllers/tasks.js`](../server/controllers/tasks.js),
`stripSensitiveFields` in [`server/models/user.js`](../server/models/user.js)). This
decouples the API contract from the schema and guarantees password hashes / Jira
tokens never leave the model layer.

### Pagination

List endpoints are backward-compatible: send no params and you get the full list
(unchanged). Send `?limit=<1..200>&offset=<n>` to bound the result; the response then
includes an `X-Total-Count` header with the unfiltered total. Implemented in
[`server/lib/pagination.js`](../server/lib/pagination.js).

### Tracing

Every response carries an `X-Request-Id` header (accepts an inbound `X-Request-Id`
or generates one). Structured logs (pino) include the same id for correlation.

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Liveness — `{ status: "ok" }` |
| GET | `/api/health/ready` | — | Readiness — checks Postgres (`select 1`); `200 { status: "ready" }` or `503 { status: "unavailable" }` |

## Auth (`/api/auth`)

| Method | Path | Role | Body / query | Responses |
|--------|------|------|--------------|-----------|
| POST | `/register` | — | `{ email, username, password, role }` | 201, 400, 409 |
| POST | `/login` | — | `{ email, password }` | 200 `{ token, user }`, 401 |
| GET | `/me` | any | — | 200, 401 |
| POST | `/logout` | any | — | 200 |
| GET | `/jira/oauth/status` | any | — | 200 `{ available }` |
| GET | `/jira/oauth/start` | developer | `?return_to=/path` | 200 `{ authorize_url }`, 403, 503 |
| GET | `/jira/oauth/callback` | — | OAuth query params | redirect |
| POST | `/me/jira/connect` | developer | `{ access_token }` | 200, 400, 502 |
| DELETE | `/me/jira/disconnect` | developer | — | 200 |

## Workspaces (`/api/workspaces`)

| Method | Path | Role | Responses |
|--------|------|------|-----------|
| POST | `/` | admin | 201, 403 |
| GET | `/mine` | admin | 200, 404 |
| GET | `/by-code/:code` | any | 200, 404 |
| GET | `/:id` | member | 200, 403, 404 |
| PATCH | `/:id` | admin | 200, 403, 404 |
| GET | `/:id/members` | admin | 200, 403 |
| GET | `/:id/tasks` | admin | 200, 403 |
| POST | `/:id/sprints` | admin | 201, 409, 403 |
| GET | `/:id/sprints` | member | 200, 403 |
| GET | `/:id/sprints/active` | member | 200, 403 |
| POST | `/:id/rewards` | admin | 201, 403 |
| GET | `/:id/rewards` | member | 200, 403 |
| GET | `/:id/join-requests` | admin | 200, 403 |
| POST | `/:id/join-requests` | developer | 201, 400, 409 |
| PATCH | `/:id/join-requests/:requestId` | admin | 200, 400, 404 |
| POST | `/:id/jira/connect` | admin | 200, 400, 502 |
| DELETE | `/:id/jira/disconnect` | admin | 200, 403 |

## Tasks (`/api/tasks`)

| Method | Path | Role | Body | Responses |
|--------|------|------|------|-----------|
| GET | `/` | developer | — | 200 `{ tasks }`, 403, 404 |
| POST | `/sync/:workspaceId` | admin | — | 200 sync stats, 403, 503 |
| GET | `/:id` | member | — | 200, 403, 404 |
| PATCH | `/:id/completion` | developer | `{ completed: boolean }` | 200, 403, 409 |

## Sprints (`/api/sprints`)

| Method | Path | Role | Responses |
|--------|------|------|-----------|
| PATCH | `/:id` | admin | 200, 403, 404 |
| POST | `/:id/close` | admin | 200, 403, 409 |

## Rewards (`/api/rewards`)

| Method | Path | Role | Body | Responses |
|--------|------|------|------|-----------|
| PATCH | `/:id` | admin | partial reward | 200, 403, 404 |
| DELETE | `/:id` | admin | — | 204, 400, 403 |
| POST | `/:id/coupons` | admin | `{ couponCodes, expiresAt? }` | 201, 403 |
| POST | `/:id/purchase` | developer | — | 201, 400, 403, 404 |

## Users (`/api/users`)

| Method | Path | Role | Responses |
|--------|------|------|-----------|
| GET | `/me` | any | 200 |
| PATCH | `/me` | any | 200 |
| GET | `/me/purchases` | developer | 200 |
| DELETE | `/me/purchases/:id` | developer | 204, 404 |
| GET | `/me/xp-history` | developer | 200 |
| GET | `/me/dashboard` | developer | 200 |

## Join requests (`/api/join-requests`)

| Method | Path | Role | Responses |
|--------|------|------|-----------|
| GET | `/me` | developer | 200 `{ join_request }` |

## E2E seed (`/api/e2e/seed`) — `E2E_SEED_ENABLED=true` only

| Method | Path | Body |
|--------|------|------|
| POST | `/task` | `{ workspaceId, developerId, title, assign?: false }` |
| POST | `/reward` | `{ workspaceId, title, couponCode, xpCost, expiresAt, createdBy }` |
| POST | `/reconcile-assignments` | `{ taskId, developerIds: [] }` |

## Common error codes

| Code | Meaning |
|------|---------|
| 401 | Missing/invalid JWT |
| 403 | Wrong role or workspace |
| 404 | Resource not found |
| 409 | Conflict (duplicate sprint, double completion) |
| 400 | Validation / business rule (insufficient XP, expired coupon) |
| 503 | Jira not configured |
