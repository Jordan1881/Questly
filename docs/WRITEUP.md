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
3. **XP economy** — season score / sprint XP (resets on sprint close), lifetime XP (levels), coins (100 XP = 10 coins).
4. **Rewards** — admins upload coupon codes; developers spend **coins** in the Reward Shop.

## Jira integration

**Two-layer model (S15):**

| Layer | Who | Where | Purpose |
|-------|-----|-------|---------|
| Workspace | Admin | Admin → Jira | Sync issues into quests (`POST /api/tasks/sync/:workspaceId`) |
| Developer | Developer | Profile | Personal connect for assignee mapping (`jira_account_id`) |

- Production uses **per-workspace** credentials in Postgres — no global `JIRA_*` on Railway.
- Platform env (`ATLASSIAN_CLIENT_ID/SECRET`) is for OAuth only.
- After join approval, developers see the team site hostname (`expected_jira_site_url`) in Dashboard/Profile.
- Developers complete tasks **in Questly** to earn XP; Jira Done status is display-only until synced.
- Story points → difficulty → XP: 1–2 Easy/20, 3–5 Medium/40, 8+ Hard/70.
- Jira tokens at rest are encrypted when `JIRA_TOKEN_ENCRYPTION_KEY` is set (T159).

### System ownership and limitations

**Jira is the source of truth for issues**: project scope, issue details, assignees, story points, priority, dates, and displayed workflow status. **Questly is the source of truth for completion and rewards**: per-member quest completion, XP, levels, Coins, purchases, and coupon fulfilment.

Questly intentionally does not replace Jira boards, workflows, comments, or issue editing. Completing a quest does not currently transition its Jira issue; a later sync refreshes the displayed Jira status. Sync is admin-initiated rather than webhook- or schedule-driven. These limits keep the project focused on secure multi-tenant integration and the complete work-to-reward loop.

## Testing strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Frontend units | Vitest + Testing Library | Stores, components, hooks |
| Backend integration | Jest + Supertest | Routes, models, Jira nock |
| E2E | Playwright (15 tests) | Auth, onboarding, 5 journeys, assignees |
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
- Join approval must not throw when Jira lookup fails; developer Jira connect is optional until workspace approval.
- Jira issue IDs are not globally unique across tenants; the sync now upserts and prunes by `workspace_id` plus `jira_issue_id` (#203).
- Join approval must not throw when Jira is unconfigured (CI E2E).
- Playwright needs `workers: 1` and production build (`serve`) to match CI.
- Lifetime XP (level), season score (sprint XP), and spendable coins must be clearly labeled in UI (dashboard vs profile vs shop).

## Production URLs

- Frontend: https://questly-gilt.vercel.app
- API: https://questly-production-f5ba.up.railway.app
