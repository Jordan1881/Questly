# Tasks: Questly Security Hardening Epic

**Input**: Design documents from `/specs/001-security-hardening/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required for security behavior (explicit in spec FR-012)

**Organization**: Phases map to user stories US1–US4; each story → separate PR from `main`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1…US4

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Speckit + epic scaffolding on branch from main

- [x] T001 Initialize Speckit (`specify init --here --integration cursor-agent`) and create branch `001-security-hardening` from `origin/main`
- [x] T002 [P] Author `specs/001-security-hardening/spec.md`
- [x] T003 [P] Author `plan.md`, `research.md`, `data-model.md`, `contracts/avatar-upload.md`, `quickstart.md`
- [ ] T004 Ensure `.scannerwork/` ignored; keep `sonar-project.properties` available for scans (commit with epic or ensure present on phase branches)
- [ ] T005 Commit Speckit `.specify/` + `specs/001-security-hardening/` + Cursor speckit skills as agreed (when user requests commit)

**Checkpoint**: Planning artifacts complete — implementation not started

---

## Phase 2: Foundational (Blocking for US1)

**Purpose**: Shared limits module before upload/UI work

- [ ] T006 Create `shared/avatarUploadLimits.json` with `maxBytes: 2097152`, `maxMbLabel`, `allowedMime`, `minSourcePx`
- [ ] T007 Confirm server can `require('../shared/avatarUploadLimits.json')` and FE can `import` the JSON (adjust path/alias only if needed)

**Checkpoint**: Shared limits readable from FE and BE

---

## Phase 3: User Story 1 - Safe avatar uploads (P1) 🎯 MVP

**Goal**: Close Sonar upload vulnerability; 2 MB + Content-Length + magic bytes + FE guard

**Independent Test**: `server/tests/uploadAvatar.test.js` + FE size guard + Sonar `vulnerabilities=0`

**PR**: cut from `main` (e.g. `fix/avatar-upload-limits`) including foundational T006–T007

### Tests for User Story 1

- [ ] T008 [P] [US1] Add failing API tests in `server/tests/uploadAvatar.test.js` for: happy path, oversize file, oversize/non-numeric Content-Length, magic-byte mismatch, invalid MIME
- [ ] T009 [P] [US1] Add/adjust FE test in `src/tests/components/EditProfileForm.test.jsx` for >2 MB rejection before `uploadAvatar`

### Implementation for User Story 1

- [ ] T010 [US1] Update `server/middleware/uploadAvatar.js` to use shared `maxBytes` for multer `limits.fileSize` and error copy
- [ ] T011 [US1] Add Content-Length pre-check in upload middleware (reject > max or non-numeric; allow missing)
- [ ] T012 [US1] Implement zero-dep magic-byte validation for jpeg/png/webp/gif; reject mismatches after multer
- [ ] T013 [US1] Wire MIME allowlist from shared JSON (keep behavior aligned)
- [ ] T014 [US1] Update `src/components/EditProfileForm.jsx` helper text + `file.size` guard from shared JSON
- [ ] T015 [US1] Run server tests; fix until green
- [ ] T016 [US1] Restart Sonar if needed; run `sonar-scanner`; confirm **vulnerabilities = 0**; open PR to `main`

**Checkpoint**: US1 done — MVP security fix merged or ready to merge

---

## Phase 4: User Story 2 - Keyboard-accessible dismiss overlays (P2)

**Goal**: Clear 4 Sonar a11y bugs with real dismiss buttons

**Independent Test**: Keyboard dismiss on four surfaces; Sonar bugs gone

**PR**: from `main` after P1 merge

### Tests for User Story 2

- [ ] T017 [P] [US2] Add/extend component tests for keyboard activation of backdrop dismiss where practical (`Sidebar`, `AnimatedModal`, overlays)

### Implementation for User Story 2

- [ ] T018 [US2] Add shared `src/components/DismissBackdrop.jsx` (`<button type="button" aria-label="Dismiss">`) or equivalent
- [ ] T019 [P] [US2] Replace clickable overlay `div` in `src/components/Sidebar.jsx`
- [ ] T020 [P] [US2] Replace backdrop handling in `src/components/motion/AnimatedModal.jsx`
- [ ] T021 [P] [US2] Replace backdrop in `src/overlays/PurchaseConfirm.jsx`
- [ ] T022 [P] [US2] Replace backdrop in `src/overlays/JiraAuth.jsx`
- [ ] T023 [US2] Re-scan Sonar; confirm four a11y bugs cleared; open PR

**Checkpoint**: US2 done

---

## Phase 5: User Story 3 - Auth & Jira security review (P3)

**Goal**: Structured review + Critical/High fixes

**Independent Test**: Checklist complete; Critical/High fixed; Medium follow-ups filed

**PR**: from `main` after P2 (or parallel only if no file conflicts — default sequential)

### Implementation for User Story 3

- [ ] T024 [US3] Create `specs/001-security-hardening/review/auth-jira-checklist.md` and mark each area Reviewed
- [ ] T025 [P] [US3] Review authn (`verifyToken`, JWT secret handling) and authz (role/workspace middleware)
- [ ] T026 [P] [US3] Review Jira OAuth/state/pending flow and `jiraTokenCrypto` / token storage
- [ ] T027 [P] [US3] Review avatar static/local serving and upload auth requirements
- [ ] T028 [P] [US3] Review `e2e/seed` gating and rate limiters; secret leakage in errors/logs
- [ ] T029 [US3] Fix all Critical/High findings with tests where applicable
- [ ] T030 [US3] File Medium findings as follow-up issues/tasks
- [ ] T031 [US3] Sonar re-scan; confirm no new High security issues; open PR

**Checkpoint**: US3 done

---

## Phase 6: User Story 4 - Critical & Major smells (P4)

**Goal**: Remediate Critical+Major Sonar smells; triage Minors

**Independent Test**: Sonar Critical+Major cleared or listed in `acceptances.md`

**PR**: one or more PRs from `main`, batched by rule if large

### Implementation for User Story 4

- [ ] T032 [US4] Export current Critical+Major smell list from Sonar into the epic folder
- [ ] T033 [US4] Batch fixes by rule/area (e.g. cognitive complexity in `JiraSyncTab.jsx`); keep PRs reviewable
- [ ] T034 [P] [US4] Fix Critical smells
- [ ] T035 [US4] Fix Major smells (or document accepts)
- [ ] T036 [US4] Opportunistically fix cheap Minors; note remaining Minors
- [ ] T037 [US4] Write `specs/001-security-hardening/acceptances.md` for any accepted smells
- [ ] T038 [US4] Final Sonar re-scan gate; open PR(s)

**Checkpoint**: Epic complete

---

## Phase 7: Polish & Cross-Cutting

- [ ] T039 [P] Ensure epic quickstart.md matches final commands/paths
- [ ] T040 [P] Revoke any Sonar token that was pasted in chat; use a fresh env token for scans
- [ ] T041 Verify `.specify/` and `specs/001-security-hardening/` are on `main` after epic PRs land

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) → Foundational (Phase 2) → US1 (Phase 3) → US2 → US3 → US4 → Polish
- US2–US4 MUST NOT start implementation until US1 Sonar vuln gate is done (agreed order A)
- Foundational T006–T007 block US1 implementation

### User Story Dependencies

- **US1**: After foundational shared JSON
- **US2**: After US1 merged (preferred); no code dependency on upload changes
- **US3**: After US2 (sequential default)
- **US4**: After US3; may need fresh Sonar export

### Parallel Opportunities

- T002/T003 done in planning
- T008/T009 can be written together before implementation
- T019–T022 after T018
- T025–T028 review areas in parallel during P3

---

## Implementation Strategy

### MVP First (US1 only)

1. Finish foundational shared JSON
2. Implement US1 + tests + Sonar vulns=0
3. **STOP** — merge P1 PR before a11y/smells/review code

### Incremental Delivery

1. P1 upload security PR  
2. P2 a11y PR  
3. P3 review+fixes PR  
4. P4 smell PR(s)

---

## Notes

- Do not commit Sonar tokens
- Prefer restarting local Sonar over waiving gates
- Constitution ratification explicitly out of scope for this epic
