# S02 Backend — Auth System Issues

---

## Issue 1: User registration + login (credentials layer)

### What to build

Full credentials flow end-to-end: install `bcryptjs` and `jsonwebtoken`, build `models/user.js` with `create`, `findByEmail`, and `findById`, wire `POST /api/auth/register` and `POST /api/auth/login` into `routes/auth.js` and `controllers/auth.js`, mount the router in `routes/index.js`, and cover all cases in `tests/auth.test.js`.

Register hashes the password with bcrypt (saltRounds = 12), inserts the user, and returns `{ user, token }` (201). Login fetches the user by email, compares the password hash, and returns `{ user, token }` (200). `password_hash` never appears in any response.

### Acceptance criteria

- [ ] `bcryptjs` and `jsonwebtoken` are installed in `server/`
- [ ] `models/user.js` exports `create(fields)`, `findByEmail(email)`, `findById(id)` — all strip `password_hash` before returning (except `findByEmail` internally for login)
- [ ] `POST /api/auth/register` returns 201 `{ user: { id, email, username, role }, token }` on success
- [ ] `POST /api/auth/register` returns 409 when email already exists
- [ ] `POST /api/auth/register` returns 400 when any of `email`, `username`, `password`, `role` are missing
- [ ] `POST /api/auth/login` returns 200 `{ user: { id, email, username, role }, token }` with a valid JWT on success
- [ ] `POST /api/auth/login` returns 401 with the same message for wrong password and unknown email (no field hints)
- [ ] JWT payload is `{ sub: userId, role }`, signed with `config.jwt.secret`, expiry `config.jwt.expiresIn`
- [ ] `workspace_id` is `null` for all newly registered users
- [ ] Integration tests pass: register (201, 409, 400) + login (200, 401 wrong password, 401 unknown email)
- [ ] Test lifecycle: `beforeAll` runs `knex migrate:latest` on `questly_test`, `beforeEach` truncates `users` + `workspaces`, `afterAll` calls `knex.destroy()`

### Blocked by

None — can start immediately.

---

## Issue 2: Auth middleware + protected endpoints (me + logout)

### What to build

The stateless auth layer and the two endpoints that depend on it. Build `middleware/verifyToken.js` — decodes the Bearer token, calls `UserModel.findById`, and attaches the full user row to `req.user` (including `jira_access_token` and `jira_account_id`). Build `middleware/requireRole(...roles)` — checks `req.user.role` against the allowed list. Add `me()` and `logout()` to `controllers/auth.js`. Wire `GET /api/auth/me` and `POST /api/auth/logout` behind `verifyToken`. Cover all error cases in `tests/auth.test.js`.

### Acceptance criteria

- [ ] `middleware/verifyToken.js` returns 401 when `Authorization` header is missing
- [ ] `middleware/verifyToken.js` returns 401 when the token is expired or tampered
- [ ] `middleware/verifyToken.js` returns 401 when the user ID in the token no longer exists in the DB
- [ ] `middleware/verifyToken.js` attaches the full user row to `req.user`, including `jira_access_token` and `jira_account_id`
- [ ] `middleware/requireRole(...roles)` returns 403 when `req.user.role` is not in the allowed list
- [ ] `GET /api/auth/me` returns 200 `{ user: { id, email, username, role, workspace_id, avatar_url, current_sprint_xp, lifetime_xp } }` with a valid token
- [ ] `GET /api/auth/me` returns 401 with no token or an invalid token
- [ ] `POST /api/auth/logout` returns 200 `{ message: 'Logged out' }` with a valid token
- [ ] `POST /api/auth/logout` returns 401 without a token
- [ ] Integration tests pass for all me + logout cases above

### Blocked by

- Issue 1 (needs `UserModel.findById` and a way to mint tokens for test setup)

---

## Issue 3: Admin workspace creation

### What to build

Admin-gated workspace endpoint end-to-end. Build `models/workspace.js` with `create(fields)` and `findById(id)`. Build `controllers/workspace.js` with a `create()` handler. Wire `POST /api/workspaces` in `routes/workspaces.js` behind `verifyToken` + `requireRole('admin')`. Mount the router in `routes/index.js`. Cover all cases in `tests/workspaces.test.js`.

### Acceptance criteria

- [ ] `models/workspace.js` exports `create(fields)` and `findById(id)`
- [ ] `POST /api/workspaces` returns 201 `{ workspace: { id, name, admin_id } }` when called by an admin with a valid token and a `name` in the body
- [ ] `POST /api/workspaces` returns 403 when called by a developer (valid token, wrong role)
- [ ] `POST /api/workspaces` returns 401 when called without a token
- [ ] `POST /api/workspaces` returns 400 when `name` is missing from the body
- [ ] Integration tests pass: admin 201, developer 403, unauthenticated 401, missing name 400
- [ ] Test lifecycle matches Issue 1 pattern (migrate, truncate, destroy)

### Blocked by

- Issue 2 (needs `verifyToken` + `requireRole`)

---

## Issue 4: Frontend auth wiring

### What to build

Replace the stubs in `src/stores/authStore.js` with real API calls. The `apiFetch` helper in `src/lib/api.js` already attaches the Bearer token. Update `src/stores/authStore.test.js` to mock the API layer rather than hardcoded mock data.

Specifically:
- `login()` — replace stub with `POST /api/auth/login`; on success set `user`, `token`, `userRole`, `isLoggedIn`
- `register()` — replace stub with `POST /api/auth/register`; same state update on success
- `logout()` — fire `POST /api/auth/logout` (best-effort, don't block on failure) then clear local state

### Acceptance criteria

- [ ] `authStore.login()` calls `POST /api/auth/login` and stores the real JWT and user object
- [ ] `authStore.register()` calls `POST /api/auth/register` and stores the real JWT and user object
- [ ] `authStore.logout()` fires `POST /api/auth/logout` (fire-and-forget) then clears all auth state
- [ ] Auth store tests mock the fetch/apiFetch layer — no hardcoded mock tokens or user objects

### Blocked by

- Issue 1 (register + login endpoints must exist)
- Issue 2 (`/me` endpoint must exist)
