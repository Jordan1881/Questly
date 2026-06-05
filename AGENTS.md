# AGENTS.md

## Cursor Cloud specific instructions

Questly is a two-app repo: React/Vite frontend at the repo root and Express API in `server/`. Full local dev and E2E require PostgreSQL plus both apps running.

### Services

| Service | Port | Start command |
|---------|------|---------------|
| PostgreSQL 15 | 5432 | `docker compose up -d` **or** system Postgres with DBs `questly_dev`, `questly_test`, `questly_prod` (see `docker-initdb/init.sql`) |
| Questly API | 3001 | `cd server && npm run dev` (needs `server/.env`; copy from `.env.example` and set `JWT_SECRET`) |
| Questly frontend | 5173 | `npm run dev` (proxies `/api` → `:3001` per `vite.config.js`) |

Start Postgres and run migrations once per environment: `cd server && npm run migrate` (and `npm run migrate:test` before backend tests).

### Commands (see also `.github/workflows/ci.yml`)

| Task | Command |
|------|---------|
| Frontend lint | `npm run lint` — ESLint is configured for browser/ESM; it currently lints `server/` too and reports many `no-undef` errors. Lint only frontend with `npx eslint src` if you need a clean pass without changing config. |
| Frontend unit tests | `npm run test:coverage` |
| Backend unit tests | `cd server && npm run migrate:test && npm test` |
| Frontend build | `npm run build` |
| E2E | Postgres + migrated dev DB + API + frontend on 5173, then `npx playwright test` |

### Non-obvious gotchas

- **`server/.env` is gitignored.** On a fresh clone, `cp .env.example server/.env` and set `JWT_SECRET` before starting the API.
- **Docker is optional.** CI and `docker-compose.yml` only run Postgres. This Cloud VM may use system PostgreSQL instead; ensure `postgres` user password matches `server/.env` (`DB_PASSWORD=postgres`).
- **Login uses email**, not username, despite the sign-in label.
- **Jira connect modal** appears after signup/login; dismiss or skip to reach routes like `/dashboard`.
- **Long-running dev servers:** use tmux (e.g. sessions `questly-api`, `questly-frontend`) so processes survive beyond a single shell command.

### Hello-world smoke check

```bash
curl -s http://localhost:3001/api/health
curl -s -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","username":"You","password":"TestPass123!","role":"developer"}'
```

Then open `http://localhost:5173`, sign up or sign in, and load `/dashboard`.
