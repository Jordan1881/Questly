# Auth & Jira Security Review Checklist (P3)

**Epic**: `001-security-hardening`  
**Date**: 2026-08-13  
**Scope**: Authn/authz, Jira OAuth/token crypto, avatar serve/upload, e2e seed, rate limits, secret leakage

| Area | Status | Notes |
|------|--------|-------|
| Authn (`verifyToken`, JWT secret, login/register) | Reviewed | OAuth-state-as-session fixed; Medium follow-ups filed |
| Authz (role / workspace middleware) | Reviewed | Membership checks OK; no Critical/High |
| Jira OAuth state/pending + `jiraTokenCrypto` | Reviewed | Fail-closed encrypt in production; purpose gate in verifyToken |
| Avatar static/local serve + upload auth | Reviewed | Upload auth + magic bytes OK; public GET by design |
| E2E seed gating + rate limiters | Reviewed | Prod hard-block; rate-limit skip only `NODE_ENV=test` |
| Secret leakage in errors/logs | Reviewed | Logger redacts; Medium: errorHandler returns `err.message` |

## Findings fixed this phase

| Sev | Finding | Fix |
|-----|---------|-----|
| Critical | E2E seed usable whenever `E2E_SEED_ENABLED=true` | Block when `NODE_ENV=production` |
| High | OAuth state JWT accepted as Bearer session | `verifyToken` rejects payloads with `purpose` |
| High | `E2E_SEED_ENABLED` skipped rate limiters | Skip limiters only in `NODE_ENV=test` |
| High | Plaintext Jira tokens if encryption key unset | `encryptToken` throws in production without key |

## Medium follow-ups (filed — not blocking P3)

See GitHub issues / `follow-ups.md` if linked; otherwise track here:

1. Register password min length vs change-password (8 chars) inconsistency
2. Password change does not invalidate existing JWTs (`token_version` / iat)
3. `JWT_SECRET` entropy/length check at boot
4. OAuth error detail reflected to frontend query string
5. Generic `errorHandler` returns `err.message` on 500s

## Sign-off

- [x] T025 Authn/authz reviewed  
- [x] T026 Jira OAuth/crypto reviewed  
- [x] T027 Avatar serve/upload reviewed  
- [x] T028 E2E seed / rate limits / leakage reviewed  
- [x] Critical/High fixed with tests (T029)  
- [x] Medium follow-ups recorded (T030)  
