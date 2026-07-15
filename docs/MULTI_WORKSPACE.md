# Multi-workspace flag (operator note)

Questly’s Jira-like multi-workspace memberships ship behind a dual-path feature flag. Keep it **off** in production until you are ready to cut over.

## Enable in an environment

1. Set on the API process (Railway / `.env`):

   ```bash
   MULTI_WORKSPACE=true
   ```

2. Restart the API. Run migrations if this environment has not yet applied membership tables (`cd server && npm run migrate`).

3. Redeploy / rebuild the frontend if needed (no separate Vite flag — the UI activates when `/api/auth/me` returns a `memberships` array).

4. Smoke-check:

   ```bash
   # Should list memberships (empty array is fine for a new user)
   curl -s http://localhost:3001/api/workspaces/memberships \
     -H "Authorization: Bearer $TOKEN"
   ```

## Behavior summary

| Flag | Signup | Workspace authority | XP / coins | Header |
|------|--------|---------------------|------------|--------|
| Off (default) | Role required | `users.workspace_id` / `workspaces.admin_id` | User columns | Single-workspace shell |
| On | Role-less | `workspace_memberships` + `X-Workspace-Id` | Per membership | Workspace switcher |

## Rollback

Set `MULTI_WORKSPACE=false` (or unset) and restart the API. Membership rows remain in Postgres but are unused; legacy single-workspace paths resume.

## Verification

- Flag-off: `cd server && npm test` (default env leaves the flag off).
- Flag-on API: suites under `server/tests/multi*.test.js`, `membershipLifecycle.test.js`, `workspaceContext.test.js`.
- Flag-on UI journey: `npx playwright test -c playwright.multi.config.js e2e/multi-workspace.spec.js` (API must run with `MULTI_WORKSPACE=true`).
