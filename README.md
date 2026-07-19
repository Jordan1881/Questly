<p align="center">
  <img src="docs/screenshots/hero-page.png" alt="Questly — Turn your daily tasks into epic quests" width="720" />
</p>

<h1 align="center">Questly</h1>

<p align="center">
  <strong>Gamified task management powered by Jira.</strong><br/>
  Complete real tickets, earn XP, level up, and redeem rewards — as a team.
</p>

<p align="center">
  <a href="https://questly-gilt.vercel.app">Live App</a> ·
  <a href="https://questly-production-f5ba.up.railway.app/api/health">API</a> ·
  <a href="docs/SUBMISSION.md">Submission Package</a> ·
  <a href="docs/README.md">Documentation</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Railway-Deploy-0B0D0E?logo=railway&logoColor=white" alt="Railway" />
  <img src="https://img.shields.io/badge/GitHub_Actions-CI-2088FF?logo=githubactions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Jira_Cloud-0052CC?logo=jira&logoColor=white" alt="Jira Cloud" />
  <img src="https://img.shields.io/badge/Atlassian_OAuth-0052CC?logo=atlassian&logoColor=white" alt="Atlassian OAuth" />
  <img src="https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright&logoColor=white" alt="Playwright" />
</p>

---

## Table of contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Features](#features)
- [Architecture](#architecture)
- [Architectural decisions](#architectural-decisions)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Team](#team)

---

## Overview

Questly bridges productivity tools and team motivation. Admins connect a **workspace** to Jira Cloud; assigned issues sync as **quests** with XP derived from story points. Developers complete work inside Questly, climb levels, earn Coins, and spend them in the Reward Shop — while admins manage sprints, approvals, and team performance.

Built as a final-year Information Systems capstone, Questly runs in production on **Vercel** (frontend) and **Railway** (API + PostgreSQL).

| Role | Experience |
|------|------------|
| **Developer** | Dashboard, task list, reward shop, profile, personal Jira connect |
| **Admin** | Workspace setup, Jira sync, join requests, sprint management, reward approvals |

---

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/task-list-page.png" alt="Task List — Jira-synced quests with difficulty, XP, filters, and calendar" />
      <br/><sub><b>Task List</b> — Jira-synced quests with difficulty badges, XP rewards, filters, and due-date calendar</sub>
    </td>
    <td width="50%">
      <img src="docs/screenshots/profile-page.png" alt="Profile — level progress, XP history chart, and Jira connection status" />
      <br/><sub><b>Profile</b> — level progress, XP history chart, Jira connection status, and lifetime stats</sub>
    </td>
  </tr>
</table>

---

## Features

### Developer
- **Jira-backed quests** — assigned issues sync with difficulty, XP, due dates, and priority badges
- **XP & leveling** — lifetime XP drives levels; sprint XP resets each sprint for fair reward-shop spending
- **Dual economy** — XP for progression, Coins for purchases (default: 100 XP → 10 Coins)
- **Reward Shop** — spend coins on real-world coupon rewards (admin approval flow)
- **Task completion** — mark quests done in Questly to earn XP; Jira status is display-only until sync
- **Team Jira banner** — after join approval, UI shows the admin's Jira site hostname for guided connect
- **OAuth or API token** — personal Jira connect via Atlassian 3LO or classic API token

### Admin
- **Workspace & Jira** — connect workspace Jira (API token or OAuth), sync issues, prune stale tasks
- **Join requests** — approve developers; team `jira_site_url` travels with approval
- **Sprint management** — open/close sprints; sprint XP resets on close with audit trail
- **Reward catalog** — upload coupon codes, approve/deny purchase requests
- **Team dashboard** — leaderboard, member XP, pending approvals

### Platform
- **Multi-tenant isolation** — every task, reward, and assignment is workspace-scoped
- **Encrypted tokens** — Jira credentials encrypted at rest (AES-256-GCM) when `JIRA_TOKEN_ENCRYPTION_KEY` is set
- **Legal & compliance** — `/privacy` and `/terms` pages; Atlassian personal-data reporting API
- **CI/CD** — GitHub Actions: backend tests, frontend coverage, Playwright E2E, deploy to Railway + Vercel

---

## Architecture

Questly is a **two-app monorepo**. The browser loads static assets from Vercel; authenticated API calls go to Railway via `VITE_API_URL`.

```mermaid
flowchart TB
  subgraph client [Browser]
    UI[React SPA<br/>Zustand + React Router]
  end

  subgraph vercel [Vercel]
    FE[Static build<br/>Vite]
  end

  subgraph railway [Railway]
    API[Express API<br/>JWT middleware]
    DB[(PostgreSQL<br/>Knex migrations)]
  end

  subgraph atlassian [Atlassian Cloud]
    Jira[Jira REST API]
    OAuth[OAuth 3LO]
  end

  UI --> FE
  UI -->|Bearer JWT| API
  API --> DB
  API -->|Workspace credentials| Jira
  API -->|Developer OAuth| OAuth
```

### Core domains

| Domain | Responsibility |
|--------|----------------|
| **Workspaces** | Tenant boundary — admin owns workspace, developers join via invite code |
| **Jira sync** | Admin pulls project issues → quests; story points map to difficulty and XP |
| **Task assignments** | Per-user completion state; shared tasks supported |
| **XP economy** | Sprint XP (resets), lifetime XP (levels), Coins (reward shop) |
| **Rewards** | Admin-managed catalog; developer purchases require approval |

### Jira integration model

Two layers keep admin sync and developer identity separate:

| Layer | Actor | Storage | Purpose |
|-------|-------|---------|---------|
| **Workspace** | Admin | `workspaces.jira_*` | Sync issues, assignee lookup, project scope |
| **Developer** | Developer | `users.jira_account_id` + tokens | Map Jira assignee → Questly user |

Platform env (`ATLASSIAN_CLIENT_ID`, `ATLASSIAN_CLIENT_SECRET`) is used **only** for OAuth — not for per-tenant API calls. Production credentials live in Postgres per workspace.

**Story points → XP:**

| Story points | Difficulty | XP reward |
|-------------|------------|-----------|
| 1–2 | Easy | 20 |
| 3–5 | Medium | 40 |
| 8+ | Hard | 70 |
| unset | Medium | 40 |

---

## Architectural decisions

Decisions made during development, with rationale:

### Multi-tenancy & data isolation
- **Workspace-scoped everything** — tasks upsert on `(workspace_id, jira_issue_id)` so tenants never collide, even when Jira issue IDs overlap across sites.
- **JWT role checks** — `admin` and `developer` roles enforced in middleware and route guards; cross-workspace access returns 403.
- **No platform Jira fallback in production** — global `JIRA_*` env vars work for local dev/CI only; Railway uses per-workspace DB credentials.

### Jira onboarding (S15/S16)
- **One mental model for developers** — "connect *my* Jira → join a team → get work." Workspace sync stays admin-only and hidden from developer UI.
- **Team site travels with join** — on approval, `expected_jira_site_url` is returned so developers see the correct Atlassian hostname before connecting.
- **Friendly gating** — pre-workspace users get empty states and clear copy, not raw 401/503 errors from missing Jira config.
- **Dual connect paths** — developers use OAuth 3LO or API token; admins use workspace OAuth or API token for sync.

### Task lifecycle
- **Complete in Questly, not Jira** — XP is awarded on `PATCH /api/tasks/:id/completion` in Questly. Jira Done status is informational until the next sync.
- **Per-assignment completion** — multiple developers can share a quest; each has their own `completed_at` on `task_assignments`.
- **Sync prune** — after each Jira sync, tasks whose `jira_issue_id` no longer exists in Jira are removed automatically.
- **Reconcile assignments** — sync adds/removes assignees based on Jira assignee changes; completed assignments are preserved.

### XP & rewards economy
- **Sprint XP vs lifetime XP** — sprint XP resets when admin closes a sprint (fair reward-shop seasons); lifetime XP drives levels and profile stats.
- **`xp_transactions` audit trail** — every award and revocation is logged for debugging and integrity.
- **Soft-delete purchases** — coupons can be removed from My Rewards UI while purchase records remain for audit.

### Security & compliance
- **AES-256-GCM token encryption** — Jira refresh/access tokens stored with `enc:v1:` prefix when `JIRA_TOKEN_ENCRYPTION_KEY` is set; plaintext read-through when unset (dev).
- **No `password_hash` in API responses** — `UserModel.strip()` on all outward-facing user objects.
- **Atlassian distribution** — privacy/terms pages and personal-data reporting API for OAuth app compliance.

### Frontend architecture
- **React Router 7** — file-based routes with `ProtectedRoute` role guards; replaced early custom state routing.
- **Zustand stores** — domain stores (`authStore`, `taskStore`, `rewardStore`, etc.) instead of prop drilling.
- **Vite dev proxy** — `/api` → `localhost:3001` in development; `VITE_API_URL` baked at build for production.

### Testing & CI
- **Jest + nock for Jira** — backend sync tests intercept real HTTP shapes without mocking the sync service.
- **E2E seed API** — test-only endpoints seed workspaces/tasks without live Jira in Playwright CI.
- **Playwright `workers: 1`** — serial E2E avoids race conditions on shared test DB.
- **Coverage thresholds** — Vitest (frontend) and Jest (backend) enforce minimum coverage in CI.

### Operations
- **Knex migrations** — schema changes are versioned; `npm run migrate` on Railway after deploy.
- **Duplicate task cleanup script** — one-time `server/scripts/cleanup-duplicate-jira-tasks.cjs` for orphan rows from pre-S14 workspaces.
- **Monorepo deploy split** — Vercel builds repo root (frontend); Railway builds `server/` as `/app`.

---

## Tech stack

### Frontend

| Technology | Role |
|------------|------|
| [React 19](https://react.dev) | UI framework |
| [Vite 7](https://vite.dev) | Build tool & dev server |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [React Router 7](https://reactrouter.com) | Client-side routing & role guards |
| [Zustand](https://zustand.docs.pmnd.rs) | Lightweight global state |
| [ESLint 9](https://eslint.org) | Linting (flat config) |

### Backend

| Technology | Role |
|------------|------|
| [Node.js](https://nodejs.org) | JavaScript runtime |
| [Express 4](https://expressjs.com) | HTTP API framework |
| [Knex.js](https://knexjs.org) | SQL query builder & migrations |
| [PostgreSQL 15](https://www.postgresql.org) | Primary database |
| [pg](https://node-postgres.com) | Postgres driver |
| [Helmet](https://helmetjs.github.io) | Security headers |
| [CORS](https://github.com/expressjs/cors) | Cross-origin policy |
| [Morgan](https://github.com/expressjs/morgan) | HTTP request logging |
| [dotenv](https://github.com/motdotla/dotenv) | Environment configuration |

### Auth & security

| Technology | Role |
|------------|------|
| [JWT](https://github.com/auth0/node-jsonwebtoken) (`jsonwebtoken`) | Stateless session tokens |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Password hashing |
| AES-256-GCM | Jira token encryption at rest (`JIRA_TOKEN_ENCRYPTION_KEY`) |

### Integrations

| Technology | Role |
|------------|------|
| [Jira Cloud REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/) | Issue sync, assignee lookup |
| [Atlassian OAuth 3LO](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/) | Developer & admin Jira connect |
| [Atlassian Personal Data API](https://developer.atlassian.com/cloud/jira/platform/user-privacy-guide/) | GDPR-style data reporting |

### Infrastructure & DevOps

| Technology | Role |
|------------|------|
| [Vercel](https://vercel.com) | Frontend hosting & CDN |
| [Railway](https://railway.app) | API hosting + managed PostgreSQL |
| [GitHub](https://github.com/Jordan1881/Questly) | Source control & issue tracking |
| [GitHub Actions](https://github.com/features/actions) | CI pipeline (test → E2E → deploy) |
| [Docker Compose](https://docs.docker.com/compose/) | Local PostgreSQL 15 for development |
| [vercel.json](vercel.json) | SPA rewrites for client-side routing |

### Testing

| Technology | Role |
|------------|------|
| [Vitest](https://vitest.dev) | Frontend unit tests |
| [Testing Library](https://testing-library.com) | Component testing |
| [Jest](https://jestjs.io) | Backend integration tests |
| [Supertest](https://github.com/ladjs/supertest) | HTTP assertion helper |
| [nock](https://github.com/nock/nock) | Jira HTTP mocking in backend tests |
| [Playwright](https://playwright.dev) | End-to-end browser tests |
| [jsdom](https://github.com/jsdom/jsdom) | DOM environment for Vitest |

---

## Repository layout

```
Questly/
├── src/                    # React frontend
│   ├── pages/              # Route-level views
│   ├── components/         # Shared UI (TaskCard, JiraIntegrationCard, …)
│   ├── stores/             # Zustand state (auth, tasks, rewards, …)
│   ├── router/             # React Router config + ProtectedRoute
│   └── lib/                # API client, XP helpers
├── server/                 # Express API
│   ├── controllers/        # Route handlers
│   ├── models/             # Knex data access
│   ├── services/           # Jira sync, XP, rewards, OAuth
│   ├── migrations/         # PostgreSQL schema (16 migrations)
│   └── scripts/            # Prod ops (duplicate task cleanup)
├── e2e/                    # Playwright journeys
├── docs/                   # API, write-up, demo, screenshots, archive
├── scripts/                # Jira smoke test + dev GitHub tooling
├── .env.example            # Env template → copy to server/.env
├── AGENTS.md               # Cursor Cloud dev guide
└── DEPLOY.md               # Production deployment runbook
```

---

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL 15 ([Docker Compose](docker-compose.yml) or local install)

### Quick start

```bash
git clone https://github.com/Jordan1881/Questly.git
cd Questly
npm install && cd server && npm install && cd ..

docker compose up -d                              # Postgres
cp .env.example server/.env                     # set JWT_SECRET
cd server && npm run migrate && cd ..

# Terminal 1 — API (:3001)
cd server && npm run dev

# Terminal 2 — Frontend (:5173, proxies /api → :3001)
npm run dev
```

Open **http://localhost:5173**. Sign-in uses **email** (not the username label). Dismiss or skip the Jira connect modal to reach `/dashboard`.

For Jira integration locally, copy secrets from `.env.example` into `server/.env` — see [AGENTS.md](AGENTS.md).

---

## Testing

```bash
# Frontend unit tests + coverage
npm run test:coverage

# Backend integration tests
cd server && npm run migrate:test && npm test

# E2E (Postgres + migrated DB + both servers running)
npx playwright test
```

| Layer | Tool | What it covers |
|-------|------|----------------|
| Frontend units | Vitest + Testing Library | Stores, components, hooks |
| Backend integration | Jest + Supertest + nock | Routes, models, Jira sync |
| E2E | Playwright | Auth, onboarding, 5 user journeys |
| Security / edge | Jest | Cross-workspace 403, concurrency, edge cases |

---

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://questly-gilt.vercel.app |
| API + DB | Railway | https://questly-production-f5ba.up.railway.app |

Full runbook: **[DEPLOY.md](DEPLOY.md)** — env vars, OAuth callbacks, migrations, Atlassian distribution, ops scripts.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/PROJECT-OVERVIEW.md](docs/PROJECT-OVERVIEW.md) | Presentation overview — architecture, user stories, metrics, scope |
| [docs/API.md](docs/API.md) | REST API reference |
| [docs/WRITEUP.md](docs/WRITEUP.md) | Architecture deep-dive |
| [docs/DEMO.md](docs/DEMO.md) | Demo script & talking points |
| [docs/SUBMISSION.md](docs/SUBMISSION.md) | Capstone deliverables (M8) |
| [docs/questly-schema.mermaid](docs/questly-schema.mermaid) | ER diagram |
| [AGENTS.md](AGENTS.md) | Cloud agent / local dev guide |
| [DEPLOY.md](DEPLOY.md) | Production deployment |

---

## Team

Two-person capstone, built as a pair with primary ownership split by area. Full
breakdown in [CONTRIBUTORS.md](CONTRIBUTORS.md).

| Name | GitHub | Primary area |
|------|--------|--------------|
| Yarden (Jordan) Biton | [@Jordan1881](https://github.com/Jordan1881) | Backend, database, security, Jira, testing & CI |
| Or Moskowitz | [@ormosko28](https://github.com/ormosko28) | Frontend, UI/UX, design system, client state |

---

<p align="center">
  <sub>Built with ☕ and a lot of XP — Questly © 2026</sub>
</p>
