# Research: Questly Security Hardening

**Date**: 2026-08-13

## R1 — Sonar baseline (Aug 2026 local scan)

- Project key: `questly`
- Vulnerability (MAJOR): `server/middleware/uploadAvatar.js` — content length / `fileSize` limit safety (then 8 MB)
- Bugs (4, MINOR a11y): clickable non-interactive elements in `Sidebar.jsx`, `AnimatedModal.jsx`, `PurchaseConfirm.jsx`, `JiraAuth.jsx`
- Security hotspots: 0
- Code smells: ~113 (≈11 Critical, ≈61 Major, ≈46 Minor)
- Decision: Epic covers all of the above plus magic-byte sniffing, shared limits JSON, and auth/Jira review

## R2 — Avatar pipeline facts

- Multer `memoryStorage` + MIME allowlist already exist
- `sharp` normalizes to 1024² WebP (`server/lib/avatarImage.js`)
- FE already checks min dimension ≥400 but not `file.size`; copy still says 8 MB
- Decision: 2 MB server+UI limit; magic-byte check before/at post-multer validation; keep sharp

## R3 — Content-Length semantics

- Browser FormData uploads usually send `Content-Length`
- Missing header must not hard-fail (proxies/clients); multer remains hard stop
- Non-numeric / oversized header → cheap 400 before buffer
- Decision: Option B from grilling

## R4 — Shared constants across ESM/CJS

- Root package is `"type": "module"`; server is CommonJS
- Decision: `shared/avatarUploadLimits.json` (no workspace package)

## R5 — Magic bytes without new deps

- Allowed signatures: JPEG (`FF D8 FF`), PNG (`89 50 4E 47…`), GIF (`GIF87a`/`GIF89a`), WebP (`RIFF….WEBP`)
- Decision: small helper in server (zero-dep); do not add `file-type`

## R6 — A11y fix pattern

- Sonar wants keyboard path for click-to-dismiss overlays
- Decision: real `<button type="button">` backdrop (shared component preferred) over role=button div hacks

## R7 — Auth/Jira review scope

- Surface: `verifyToken`, role/workspace middleware, Jira OAuth routes, token crypto, avatar static/local serve, `e2e/seed` + `E2E_SEED_ENABLED`, rate limiters, helmet/cors
- Decision: checklist review; fix Critical/High in P3; Medium → follow-ups

## R8 — Speckit / delivery

- `specify init --here --integration cursor-agent` completed
- Branch `001-security-hardening` cut from `origin/main`
- Decision: one epic Speckit feature; phased PRs P1→P4; commit specs + `.specify`
