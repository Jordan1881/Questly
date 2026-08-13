# Implementation Plan: Questly Security Hardening Epic

**Branch**: `001-security-hardening` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-security-hardening/spec.md`

## Summary

Phased security/quality epic driven by SonarQube results and an expanded hardening agenda. **P1** closes the avatar upload vulnerability (2 MB limit, Content-Length pre-check, magic-byte sniff, shared JSON limits, FE guard + tests). **P2** replaces non-interactive clickable backdrops with real dismiss buttons. **P3** runs a structured auth/Jira security review and fixes Critical/High. **P4** clears Critical+Major Sonar smells (Minor triage). Each phase ships as its own PR from `main` with Sonar re-scan gates.

## Technical Context

**Language/Version**: JavaScript (Node.js backend CommonJS; frontend ESM via Vite)

**Primary Dependencies**: Express 5, multer, sharp, React 19, Vitest, Jest/Supertest, SonarScanner CLI, local SonarQube 26.8

**Storage**: Existing avatar local/S3 storage unchanged; no DB schema changes expected for P1–P2

**Testing**: Jest + Supertest (`server/tests/uploadAvatar.test.js`); Vitest for FE size-guard; Sonar re-scan per phase

**Target Platform**: Questly web app (Vite frontend + Express API), local Sonar for gates; Railway prod unchanged except safer upload defaults

**Project Type**: Full-stack web application (monorepo-style root FE + `server/`)

**Performance Goals**: Reject oversized uploads before full memory buffering when `Content-Length` is present; keep avatar processing path latency comparable

**Constraints**: No new npm deps for magic-byte sniffing; shared limits via JSON for CJS/ESM interoperability; do not expand P1 into full OWASP rewrite

**Scale/Scope**: ~17k ncloc Sonar baseline; 1 vuln + 4 a11y bugs + ~113 smells + auth/Jira review

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Speckit constitution is still the stock template stub → **deferred** (agreed lightweight path: specify → plan → tasks).
- Practical gates for this epic:
  - Prefer smallest change that closes the Sonar finding (P1).
  - Tests required for security behavior changes.
  - No secrets/tokens in git.
  - Phase PRs stay independently reviewable.

## Project Structure

### Documentation (this feature)

```text
specs/001-security-hardening/
├── plan.md
├── research.md
├── quickstart.md
├── data-model.md
├── contracts/
│   └── avatar-upload.md
├── review/                    # created in P3
│   └── auth-jira-checklist.md
├── acceptances.md             # P4 smell accepts (if any)
└── tasks.md
```

### Source Code (repository root)

```text
shared/
└── avatarUploadLimits.json          # P1 single source of truth

server/
├── middleware/uploadAvatar.js       # P1 limits + Content-Length + magic bytes
├── lib/avatarImage.js               # existing sharp pipeline (keep)
├── lib/avatarStorage.js             # existing storage (keep)
└── tests/uploadAvatar.test.js       # P1 security tests

src/
├── components/EditProfileForm.jsx   # P1 FE size guard + copy
├── components/Sidebar.jsx           # P2
├── components/motion/AnimatedModal.jsx  # P2
├── overlays/PurchaseConfirm.jsx     # P2
├── overlays/JiraAuth.jsx            # P2
└── components/DismissBackdrop.jsx   # optional shared P2 control

server/routes/, server/middleware/, server/services/jira*, server/lib/jira*
└── P3 review + targeted fixes

# P4: files implicated by Sonar Critical/Major rules (batch by rule)
```

**Structure Decision**: Keep Questly’s existing root FE + `server/` layout. Add only `shared/avatarUploadLimits.json` and epic docs under `specs/001-security-hardening/`. Optional small shared backdrop component under `src/components/` if it reduces duplication in P2.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Multi-phase epic in one Speckit feature | User requested one epic Speckit with phased PRs | Four separate Speckit features add ceremony without clearer delivery |
| Shared JSON instead of workspace package | ESM FE + CJS server | npm workspace package is heavier than needed for constants |

## Phase Delivery Map

| Phase | PR theme | Sonar gate |
|-------|----------|------------|
| P1 | Avatar upload hardening | `vulnerabilities = 0` |
| P2 | Overlay a11y dismiss buttons | 4 known bugs gone |
| P3 | Auth/Jira review + Critical/High fixes | No new High security issues; findings documented |
| P4 | Critical+Major smells | Cleared or listed in `acceptances.md` |

## Implementation Notes (How)

### P1 Upload security

1. Add `shared/avatarUploadLimits.json` with `maxBytes: 2097152`, `maxMbLabel: "2 MB"`, `allowedMime`, `minSourcePx`.
2. Update `server/middleware/uploadAvatar.js`:
   - `fileSize` from shared JSON
   - Early middleware: parse `Content-Length`; reject if > max or non-numeric; allow missing
   - After multer: magic-byte check on `req.file.buffer` for jpeg/png/webp/gif signatures; reject mismatch
3. Update FE `EditProfileForm.jsx` copy + `file.size` guard using shared JSON.
4. Add `server/tests/uploadAvatar.test.js` (oversize, Content-Length, magic-byte, happy path).
5. Restart Sonar if needed; `sonar-scanner` with local token; confirm vulns=0.

### P2 A11y

1. Introduce dismiss backdrop `<button type="button" aria-label="Dismiss">` (shared component preferred).
2. Replace clickable overlay `div`s in the four Sonar files; preserve Escape/close buttons where present.
3. Add/adjust component tests for keyboard activation where practical.
4. Re-scan; confirm bugs cleared.

### P3 Review

1. Fill `review/auth-jira-checklist.md` for: JWT authn, role/workspace authz, Jira OAuth/state/token crypto, avatar static serving, `e2e/seed` gating, rate limits, error/log secret leakage.
2. Fix Critical/High; open follow-ups for Medium.
3. Re-scan for regressions.

### P4 Smells

1. Export Sonar Critical/Major issue list; batch by rule (e.g. cognitive complexity).
2. Refactor/fix; document accepts in `acceptances.md`.
3. Re-scan gate.
