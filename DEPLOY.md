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
| `ATLASSIAN_REPORTING_REFRESH_TOKEN` | App owner's OAuth refresh token — see **Personal Data Reporting** below |

Register **both** callback URLs in the Atlassian app **Authorization → Callback URL** list.

### Avatar storage (Cloudflare R2 — required for profile photo uploads)

Profile avatars are stored in **object storage**, not on the Railway container disk. Use **Cloudflare R2** (S3-compatible, no egress fees).

**HITL — one-time setup in Cloudflare (you do this):**

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → **Create bucket** (e.g. `questly-avatars`)
2. **Manage R2 API tokens** → **Create API token** with **Object Read & Write** on that bucket
3. Note the **Access Key ID**, **Secret Access Key**, and **Account ID**
4. Bucket → **Settings** → enable **Public access** (R2.dev subdomain) **or** attach a custom domain (e.g. `avatars.yourdomain.com`)
5. Copy the public base URL (e.g. `https://pub-xxxxxxxx.r2.dev` — **no trailing slash**)

**HITL — Railway variables (Questly API service):**

| Variable | Value |
|----------|--------|
| `AVATAR_STORAGE` | `s3` |
| `S3_BUCKET` | `questly-avatars` |
| `S3_REGION` | `auto` |
| `S3_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY_ID` | From step 2 |
| `S3_SECRET_ACCESS_KEY` | From step 2 |
| `S3_PUBLIC_URL` | Public bucket URL from step 4 |

Redeploy the API after saving variables. Upload a profile photo in the app — the image URL should be `https://…/avatars/<userId>.png` (not `/api/uploads/...`).

**Local dev:** leave `AVATAR_STORAGE=local` (default). Files go to `server/uploads/` and are served from the API.

**Note:** Avatars uploaded before R2 was enabled (old `/api/uploads/...` paths) will 404 until users re-upload.

### Atlassian Distribution page (privacy, terms, sharing)

Use these public URLs in **Distribution → Vendor & security details**:

| Field | Production value |
|-------|------------------|
| **Privacy policy** | `https://questly-gilt.vercel.app/privacy` |
| **Terms of service** | `https://questly-gilt.vercel.app/terms` |
| **Customer support** | Your team support email (e.g. admin Gmail) |
| **Stores personal data?** | **Yes** (Jira account IDs + tokens) |
| **Personal Data Reporting API** | Implemented — check the confirmation box after deploy |

Then set **Distribution status** to **Sharing** and save. Non-owner users (e.g. Yarden) can OAuth after accepting the unverified-app warning.

### Personal Data Reporting API

Questly reports stored Atlassian `accountId` values to `POST https://api.atlassian.com/app/report-accounts/` daily and erases data when Atlassian returns `closed` or `updated`.

**One-time setup — app owner refresh token:**

1. As the **Atlassian app owner**, open this URL (replace `CLIENT_ID` and ensure callback matches your dev or prod API):

```
https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=CLIENT_ID&scope=read%3Ame%20offline_access&redirect_uri=https%3A%2F%2Fquestly-production-f5ba.up.railway.app%2Fapi%2Fauth%2Fjira%2Foauth%2Fcallback&response_type=code&prompt=consent
```

2. After redirect, exchange the `code` for tokens (or complete OAuth via Questly as owner and read `jira_refresh_token` from DB once).
3. Set Railway `ATLASSIAN_REPORTING_REFRESH_TOKEN` to the **refresh_token** value.
4. Redeploy API — the daily job starts automatically in production when this var is set.

### Atlassian app distribution (T158 — HITL)

1. Open your app in [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. **Authorization** → add both callback URLs above
3. **Distribution** → fill vendor details, enable **Sharing** (see table above)
4. **API token** connect remains available under **Advanced** when OAuth is configured

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

**One-time duplicate Jira task cleanup** (API service console, cwd is `/app` = `server/`):

```bash
WORKSPACE_ID=your-workspace-uuid node scripts/cleanup-duplicate-jira-tasks.cjs
WORKSPACE_ID=your-workspace-uuid node scripts/cleanup-duplicate-jira-tasks.cjs --apply
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

## 5. Security (recommended)

Questly uses layered defenses: edge protection (Cloudflare), app middleware (helmet, CORS, rate limits), and dependency scanning (Dependabot + CI audit).

### Step 1 — Cloudflare Free (frontend + API)

Use Cloudflare in front of **both** the Vercel frontend and the Railway API so traffic is filtered before it reaches your app.

**If you use a custom domain (recommended):**

1. Add your domain to [Cloudflare](https://dash.cloudflare.com) and point nameservers to Cloudflare.
2. Create DNS records with the **proxy enabled** (orange cloud):
   - `www` or `@` → CNAME to `cname.vercel-dns.com` (Vercel custom domain docs)
   - `api` → CNAME to your Railway public hostname (or Railway custom domain target)
3. In Cloudflare **SSL/TLS** → set mode to **Full (strict)**.
4. In **Security → Bots** → enable **Bot Fight Mode**.
5. Optional **Security → WAF → Firewall rules**:
   - Rate-limit or challenge repeated `POST` to `/api/auth/login` and `/api/auth/register` from the same IP.

**Vercel:** add the same custom domain in Vercel project settings (Vercel will verify via Cloudflare DNS).

**Railway:** add custom domain on the Questly API service; update env vars if URLs change:

| Variable | Example |
|----------|---------|
| `FRONTEND_URL` | `https://www.yourdomain.com` |
| `VITE_API_URL` (Vercel) | `https://api.yourdomain.com` |
| `API_PUBLIC_URL` | `https://api.yourdomain.com` |
| OAuth callback URLs | `https://api.yourdomain.com/api/auth/jira/oauth/callback` (and workspace callback) |

**Rate limiting behind Cloudflare:** set on the Railway Questly service:

```text
TRUST_PROXY_HOPS=2
```

(`1` = Railway only, `2` = Cloudflare + Railway — needed for correct client IPs in rate limits.)

**Without a custom domain:** you can still proxy a subdomain you control; the default `*.vercel.app` / `*.up.railway.app` hostnames are harder to put fully behind Cloudflare. Custom domain is the cleanest production setup.

### Step 2 — Auth rate limits (built in)

The API throttles abuse-prone routes:

| Route | Default limit |
|-------|----------------|
| `POST /api/auth/login` | 10 requests / 15 min / IP |
| `POST /api/auth/register` | 5 requests / hour / IP |
| `POST /api/auth/me/jira/connect` | 10 requests / 15 min / IP |

Override via env: `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_REGISTER_MAX`, `RATE_LIMIT_JIRA_CONNECT_MAX`.

### Step 3 — App hardening (already in codebase)

| Control | Where |
|---------|--------|
| Security headers | `helmet()` in `server/app.js` |
| CORS | Only `FRONTEND_URL` origin in production |
| SQL injection | Knex parameterized queries (no string-concat SQL) |
| JWT | `JWT_SECRET` required in production |

### Step 4 — Supply chain

- **Dependabot** (`.github/dependabot.yml`) — weekly npm update PRs for frontend and `server/`.
- **CI audit** — `npm audit --audit-level=high` on every push/PR (`--omit=dev` for frontend prod deps; full audit for `server/`). Fails on high/critical issues in scanned trees.

Locally:

```bash
npm audit
npm audit --prefix server
```

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
