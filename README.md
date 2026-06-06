# Questly

> **Turn your daily tasks into epic quests.**

Gamified task management that connects to Jira — earn XP, unlock rewards, and track progress as you complete real work.

| Environment | URL |
|-------------|-----|
| Frontend | https://questly-gilt.vercel.app |
| API | https://questly-production-f5ba.up.railway.app |

**Capstone submission (M8):** [docs/SUBMISSION.md](docs/SUBMISSION.md) · **Full docs index:** [docs/README.md](docs/README.md)

---

## Overview

Questly pulls assigned Jira tickets into a quest-style UI with XP based on story points. Developers complete tasks, level up, and spend Coins in the Reward Shop. Admins manage workspaces, sync Jira, approve rewards, and configure XP settings.

| Role | Capabilities |
|------|----------------|
| **Developer** | Dashboard, task list, reward shop, profile, personal Jira OAuth |
| **Admin** | Workspace + Jira setup, team management, reward approvals, XP settings |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, Tailwind CSS v4, React Router 7, Zustand |
| Backend | Node.js, Express, PostgreSQL, Knex |
| Auth | JWT, bcrypt |
| Integrations | Jira Cloud (API token + OAuth 3LO) |
| Testing | Vitest, Jest, Playwright, nock |
| Deploy | Vercel (frontend), Railway (API + Postgres) |

---

## Repository layout

```
Questly/
├── src/                 # React frontend (Vite)
├── server/              # Express API + migrations
├── e2e/                 # Playwright end-to-end tests
├── docs/                # API, write-up, demo, sprint plans, archive
├── scripts/             # Ops scripts (Jira test, DB cleanup) + dev/ tooling
├── .env.example         # Env template → copy to server/.env
├── AGENTS.md            # Cursor Cloud dev guide
├── DEPLOY.md            # Production deployment runbook
└── docker-compose.yml   # Local PostgreSQL
```

---

## Local development

### Prerequisites

- Node.js 18+
- PostgreSQL 15 (Docker or system install)

### Setup

```bash
git clone https://github.com/Jordan1881/Questly.git
cd Questly
npm install
cd server && npm install && cd ..

# Database (Docker)
docker compose up -d

# API env
cp .env.example server/.env
# Edit server/.env — set JWT_SECRET at minimum

# Migrations
cd server && npm run migrate && cd ..

# Terminal 1 — API (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173, proxies /api → :3001)
npm run dev
```

Open http://localhost:5173. Sign-in uses **email** (not username). See [AGENTS.md](AGENTS.md) for Jira secrets, tmux tips, and test commands.

### Test & build

```bash
npx eslint src                    # Frontend lint (clean pass)
npm run test:coverage             # Frontend unit tests
cd server && npm run migrate:test && npm test   # Backend tests
npm run build                     # Production frontend build
npx playwright test               # E2E (needs Postgres + API + frontend)
```

---

## Deployment

See [DEPLOY.md](DEPLOY.md) for Vercel, Railway, OAuth callbacks, migrations, and ops scripts.

---

## Team

| Name | Role |
|------|------|
| Yarden Biton | Lead Developer |
| Or Moskowitz | Developer |
