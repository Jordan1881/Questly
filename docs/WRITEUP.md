# Questly — Project Write-up

## Architecture

Questly is a gamified task-management app built as a **two-app monorepo**:

- **Frontend:** React 19 + Vite + Tailwind CSS + Zustand (`/`)
- **Backend:** Express + Knex + PostgreSQL (`/server`)
- **Deployment:** Vercel (frontend) + Railway (API + Postgres)

The browser talks to Vercel for static assets; API calls go to Railway via `VITE_API_URL`.

## Core domains

1. **Workspaces** — tenant boundary; admin owns workspace, developers join via code.
2. **Jira sync** — admin connects workspace Jira; issues become quests with XP from story points.
3. **XP economy** — sprint XP (resets on sprint close), lifetime XP (levels), coins (100 XP = 10 coins).
4. **Rewards** — admins upload coupon codes; developers spend sprint XP in the Reward Shop.

## Jira integration

- Admin connects workspace Jira (site, project, API token) or uses platform env in dev.
- `POST /api/tasks/sync/:workspaceId` pulls issues, upserts tasks, reconciles `task_assignments` by Jira assignee.
- Developers connect personal Jira (OAuth or manual token) for `jira_account_id` mapping.
- Story points → difficulty → XP: 1–2 Easy/20, 3–5 Medium/40, 8+ Hard/70.

## Testing strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Frontend units | Vitest + Testing Library | Stores, components, hooks |
| Backend integration | Jest + Supertest | Routes, models, Jira nock |
| E2E | Playwright (5 journeys) | Auth, join, tasks, rewards, sprints, assignees |
| Security / edge / concurrency | Jest | Cross-workspace 403, races, edge cases |
| Performance | Jest | 110-issue sync &lt; 3s |

CI (`.github/workflows/ci.yml`): backend tests → frontend coverage → E2E on push.

## Design decisions

- **Workspace-scoped data** with JWT role checks (`admin` / `developer`).
- **Per-assignment completion** — multiple developers can share a task; each has own `completed_at`.
- **Sprint XP reset** on close with `xp_transactions` audit trail.
- **Soft-delete purchases** — coupons removed from My Rewards but audit preserved.
- **E2E seed API** — test-only endpoints to avoid Jira dependency in Playwright CI.

## Lessons learned

- Global Jira env vars are fine for demos but not multi-tenant SaaS — workspace DB credentials are the target model (#179).
- Join approval must not throw when Jira is unconfigured (CI E2E).
- Playwright needs `workers: 1` and production build (`serve`) to match CI.
- Lifetime vs sprint XP must be clearly labeled in UI (dashboard vs profile).

## Production URLs

- Frontend: https://questly-gilt.vercel.app
- API: https://questly-production-f5ba.up.railway.app
