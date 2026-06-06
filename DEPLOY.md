# Deploying Questly (Vercel + Railway)

Questly runs as two apps:

| Service | Platform | Purpose |
|---------|----------|---------|
| React frontend | **Vercel** | UI at `https://questly-gilt.vercel.app` |
| Express API (`server/`) | **Railway** | REST API |
| PostgreSQL | **Railway** | Production database |

---

## Prerequisites

- GitHub repo: [Jordan1881/Questly](https://github.com/Jordan1881/Questly)
- [Railway](https://railway.app) account
- [Vercel](https://vercel.com) account linked to GitHub
- Jira Cloud site + API tokens (for task sync)

---

## 1. Railway — PostgreSQL

1. **New Project** → **Deploy from GitHub repo** → select **Questly**
2. **+ New** → **Database** → **PostgreSQL**
3. Click **Deploy database** and wait until Postgres shows **Online**

---

## 2. Railway — API service (Questly)

### Root directory

1. Click the **Questly** service (GitHub icon)
2. **Settings** → **Root Directory** → set to `server`
3. Save and deploy

### Environment variables

Open **Questly → Variables** and set:

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | **Reference** → Postgres → `DATABASE_URL` (shows as `${{Postgres.DATABASE_URL}}`) |
| `JWT_SECRET` | Long random string (`openssl rand -base64 48`) |
| `FRONTEND_URL` | `https://questly-gilt.vercel.app` (no trailing slash) |
| `JWT_EXPIRES_IN` | `7d` (optional) |

**Jira** (same names as local `.env.example`):

| Variable | Example |
|----------|---------|
| `JIRA_SITE_URL` | `https://yourteam.atlassian.net` |
| `JIRA_PROJECT_KEY` | `SCRUM` |
| `JIRA_ADMIN_EMAIL` | Admin Atlassian email |
| `JIRA_ADMIN_API_TOKEN` | From [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `JIRA_DEVELOPER_EMAIL` | Developer Atlassian email |
| `JIRA_DEVELOPER_API_TOKEN` | Developer API token |
| `JIRA_DEVELOPER_ACCOUNT_ID` | Jira `accountId` for assignee mapping |
| `JIRA_ACCOUNT_ID` | Alias for developer account ID (optional) |
| `JIRA_STORY_POINTS_FIELD_ID` | Optional — leave unset unless auto-detect fails |
| `JIRA_TOKEN_ENCRYPTION_KEY` | 32+ char random string — encrypts Jira tokens at rest (T159) |

**Atlassian OAuth 3LO** (developer + workspace admin connect — T156/T158):

| Variable | Value |
|----------|--------|
| `ATLASSIAN_CLIENT_ID` | From [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/) |
| `ATLASSIAN_CLIENT_SECRET` | Same app |
| `ATLASSIAN_OAUTH_CALLBACK_URL` | `https://YOUR-RAILWAY-URL.up.railway.app/api/auth/jira/oauth/callback` |
| `ATLASSIAN_WORKSPACE_OAUTH_CALLBACK_URL` | `https://YOUR-RAILWAY-URL.up.railway.app/api/workspaces/jira/oauth/callback` |
| `API_PUBLIC_URL` | `https://YOUR-RAILWAY-URL.up.railway.app` (optional fallback for callback derivation) |

Register **both** callback URLs in the Atlassian app **Authorization → Callback URL** list.

### Atlassian app distribution (T158 — HITL)

While the app is in **Development** mode, only the app owner and explicitly added **Test users** can complete OAuth.

1. Open your app in [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. **Authorization** → add both callback URLs above
3. For early testers (non-owner developers): **Distribution** → add each developer's Atlassian email under **Test users**, **or** submit the app for distribution review
4. After a developer is added as a test user, they can use **Connect with Jira** on Profile without an API token
5. **API token** connect remains available under **Advanced** when OAuth is configured, or as the only option when `ATLASSIAN_*` vars are unset

You can delete local-only vars (`DB_HOST`, `DB_PORT`, etc.) — production uses `DATABASE_URL`.

### Public URL

1. **Settings** → **Networking** → **Generate Domain**
2. Copy the URL, e.g. `https://questly-production-f5ba.up.railway.app`

### Run migrations (once)

**Railway Console** (Questly service → **Console**):

```bash
node -e "console.log(process.env.DATABASE_URL ? 'DATABASE_URL is set' : 'DATABASE_URL MISSING')"
npm run migrate
```

Expected: `Batch 1 run: 12 migrations`

**Or via CLI** (local machine):

```bash
npm install -g @railway/cli
railway login
cd server
railway link   # pick project + Questly service
railway run npm run migrate
```

### Smoke test

```bash
curl -s https://YOUR-RAILWAY-URL.up.railway.app/api/health
# {"status":"ok"}
```

---

## 3. Vercel — Frontend

1. Import **Questly** repo on Vercel (root = repo root, not `server/`)
2. **Settings → Environment Variables**:

| Name | Value |
|------|--------|
| `VITE_API_URL` | `https://YOUR-RAILWAY-URL.up.railway.app` |

Apply to **Production** (and Preview if desired).

3. **Redeploy** the frontend (Deployments → ⋯ → Redeploy)

Vite bakes `VITE_*` at build time — a redeploy is required after changing this value.

---

## 4. Verify end-to-end

1. Open https://questly-gilt.vercel.app
2. Sign up / sign in
3. DevTools → **Network** — API calls should go to Railway, not `vercel.app/api/...`
4. Admin: create workspace → approve join request → **Jira** tab → **Sync with Jira**
5. Developer: `/tasks` shows synced Jira quests

---

## Architecture

```
Browser → Vercel (React)
              ↓ VITE_API_URL
         Railway (Express :PORT)
              ↓ DATABASE_URL
         Railway (PostgreSQL)
              ↓ Jira REST API
         Atlassian Jira Cloud
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED` on migrate | Postgres not deployed — click **Deploy database** |
| `Missing JWT_SECRET` | Add `JWT_SECRET` on Questly service |
| CORS errors | `FRONTEND_URL` must match Vercel URL exactly |
| Frontend hits `/api` on Vercel | Set `VITE_API_URL` and **redeploy** Vercel |
| Tasks empty after sync | Developer must be in workspace; assignee email should match `JIRA_DEVELOPER_EMAIL` or issue must be unassigned in Jira |
| 502 on API | Check **Deployments → Logs** on Railway |

---

## Production URLs (Questly team)

| Service | URL |
|---------|-----|
| Frontend | https://questly-gilt.vercel.app |
| API | https://questly-production-f5ba.up.railway.app |

Update this table if domains change.
