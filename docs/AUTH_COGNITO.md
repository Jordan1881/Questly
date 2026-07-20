# Google Sign-In via AWS Cognito

Questly keeps email/password login and adds **Continue with Google** through AWS Cognito Hosted UI. Cognito proves the Google identity; Questly then issues its own JWT so the rest of the API (middleware, Jira OAuth, workspaces) is unchanged.

```
Browser → Cognito Hosted UI (Google) → Questly API callback
  → verify Cognito ID token → find/create user → Questly JWT → frontend
```

## Prerequisites

You need:

1. A **Google Cloud OAuth 2.0 Web client** (Client ID + Client Secret). Paste these into Cognito’s Google IdP — not into Questly `.env`.
2. An **AWS account** with permission to create a Cognito User Pool.

Example Client ID shape (yours will differ): `….apps.googleusercontent.com`

Questly never calls Google directly. Only Cognito app-client values go in `server/.env`.

## 1. Cognito User Pool

1. AWS Console → Cognito → **Create user pool**.
2. Sign-in options: **Email**.
3. Required attributes: **email**.
4. Create the pool and note **User pool ID** and **Region**.

## 2. Cognito domain

1. User pool → **App integration** → **Domain**.
2. Create a Cognito domain (e.g. `questly-dev`).
3. Note the host only, e.g. `questly-dev.auth.eu-central-1.amazoncognito.com`.

## 3. Google identity provider

1. In **Google Cloud Console** → APIs & Services → Credentials → your OAuth Web client.
2. Add authorized redirect URI:

   `https://<cognito-domain>/oauth2/idpresponse`

   Example: `https://questly-dev.auth.eu-central-1.amazoncognito.com/oauth2/idpresponse`

3. Cognito → User pool → **Sign-in experience** → **Federated identity provider** → **Add Google**.
4. Paste the GCP **Client ID** and **Client Secret**.
5. Map attributes: Google `email` → Cognito `email`, Google `name` → Cognito `name` (or username).

## 4. App client (Hosted UI)

1. User pool → **App integration** → **Create app client**.
2. App type: **Confidential client** (generates a client secret — needed for server-side code exchange).
3. Authentication flows: allow authorization code grant.
4. Hosted UI settings:
   - **Allowed callback URLs**:
     - Local: `http://localhost:3001/api/auth/cognito/callback`
     - Production: `https://<your-api>/api/auth/cognito/callback`
   - **Allowed sign-out URLs**: `http://localhost:5173` and your production frontend URL
   - Identity providers: **Google** (and optionally Cognito if you want Hosted UI email too — Questly only starts Google)
   - OAuth scopes: `openid`, `email`, `profile`
5. Note **Client ID** and **Client secret**.

## 5. Questly environment

Add to `server/.env` (see `.env.example`):

```bash
COGNITO_REGION=eu-central-1
COGNITO_USER_POOL_ID=eu-central-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxx
COGNITO_CLIENT_SECRET=xxxxxxxx
COGNITO_DOMAIN=questly-dev.auth.eu-central-1.amazoncognito.com
COGNITO_REDIRECT_URI=http://localhost:3001/api/auth/cognito/callback
```

When these are set, `GET /api/auth/cognito/status` returns `{ "enabled": true }` and Sign in / Sign up show **Continue with Google**.

## 6. User linking rules

| Case | Behavior |
|------|----------|
| Known `cognito_sub` | Sign in as that Questly user |
| Matching email (local account) | Link `cognito_sub`, then sign in |
| New email | Create user with `password_hash = null`, role `developer` |
| Google-only user trying password login | `401 Invalid credentials` |

## 7. API routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/auth/cognito/status` | Public | `{ enabled: boolean }` |
| GET | `/api/auth/cognito/google/start` | Public | Redirect to Cognito Hosted UI (Google) |
| GET | `/api/auth/cognito/callback` | Public | Exchange code, issue Questly JWT, redirect to frontend |

Frontend callback route: `/auth/cognito/callback?token=…` (or `cognito=error&reason=…`).

## Smoke check

1. Start API + frontend with Cognito env set.
2. Open `/login` — **Continue with Google** should appear.
3. Complete Google consent → land on dashboard (or Jira connect overlay for developers).
4. Confirm the user row has `cognito_sub` and nullable `password_hash` if first-time Google signup.
