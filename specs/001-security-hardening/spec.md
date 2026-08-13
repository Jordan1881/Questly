# Feature Specification: Questly Security Hardening Epic

**Feature Branch**: `001-security-hardening`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Plan and deliver a phased Speckit security epic based on SonarQube results for Questly: avatar upload vulnerability hardening (2 MB limit, Content-Length checks, magic-byte sniffing, shared FE/BE limits), a11y Sonar bugs on dismissible overlays, broad auth/Jira security review with Critical/High fixes, and Critical+Major code-smell remediation — each phase as its own PR from main with Sonar verification gates."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Safe avatar uploads (Priority: P1)

As a signed-in Questly user, I upload a profile photo and the system only accepts reasonably sized, real images. Oversized or spoofed files are rejected early with a clear error, and the UI tells me the same limit before I upload.

**Why this priority**: SonarQube reported a MAJOR vulnerability on the avatar upload size limit (8 MB). Closing this finding is the known exploitable/DoS-adjacent issue and the epic MVP.

**Independent Test**: Upload valid ≤2 MB images successfully; reject >2 MB via UI and API; reject files with oversized/non-numeric Content-Length; reject non-image bytes that claim an image MIME type; Sonar vulnerabilities for Questly = 0 after re-scan.

**Acceptance Scenarios**:

1. **Given** a valid JPEG/PNG/WebP/GIF ≤ 2 MB and ≥ 400px short side, **When** the user uploads an avatar, **Then** the profile photo updates successfully.
2. **Given** a file > 2 MB, **When** the user selects it in the profile UI, **Then** upload is blocked client-side with a clear size error (no request required).
3. **Given** a request with body/file > 2 MB, **When** posted to `POST /api/users/me/avatar`, **Then** the API returns 400 explaining the 2 MB limit.
4. **Given** a request with `Content-Length` present and > 2 MB (or non-numeric), **When** it hits the avatar upload middleware, **Then** it is rejected before buffering the full payload.
5. **Given** a request with missing `Content-Length`, **When** the file exceeds 2 MB, **Then** multer’s size limit still rejects it.
6. **Given** bytes that are not a real JPEG/PNG/WebP/GIF (magic bytes mismatch) even if `Content-Type` claims an image, **When** uploaded, **Then** the API rejects the file.
7. **Given** FE and BE limits, **When** either is read, **Then** both use the same values from `shared/avatarUploadLimits.json`.

---

### User Story 2 - Keyboard-accessible dismiss overlays (Priority: P2)

As a keyboard / assistive-tech user, I can dismiss modal backdrops and the mobile nav overlay without relying on a mouse-only click on a non-interactive `div`.

**Why this priority**: Sonar reported 4 BUGS (a11y): click handlers on non-interactive elements in Sidebar, AnimatedModal, PurchaseConfirm, and JiraAuth. Small, high-visibility UX/security-adjacent accessibility debt.

**Independent Test**: Each of the four surfaces can be dismissed via a real button control (and existing close controls); Sonar no longer reports those four bugs.

**Acceptance Scenarios**:

1. **Given** the mobile sidebar overlay is open, **When** the user activates the dismiss control via keyboard, **Then** the sidebar closes.
2. **Given** an AnimatedModal / PurchaseConfirm / JiraAuth overlay is open, **When** the user activates the backdrop dismiss control via keyboard, **Then** the overlay closes.
3. **Given** mouse users, **When** they click the backdrop dismiss control, **Then** behavior matches today’s click-to-dismiss intent.
4. **Given** Sonar re-scan after the PR, **When** searching those four files for the prior a11y rule, **Then** the four bugs are gone.

---

### User Story 3 - Auth & Jira security review fixes (Priority: P3)

As a Questly operator, I want authentication, authorization, Jira OAuth/token handling, upload/static serving, e2e seed exposure, rate limits, and secret leakage reviewed, with Critical/High issues fixed and Medium items tracked.

**Why this priority**: Broader than Sonar’s single vuln; reduces account/token compromise risk after the known upload hole is closed.

**Independent Test**: A written review checklist with findings; Critical/High items fixed with tests where applicable; Medium items listed as follow-ups; Sonar shows no new High security issues introduced.

**Acceptance Scenarios**:

1. **Given** the review checklist (authn/z, Jira OAuth/state/tokens, uploads/static, e2e seed, rate limits, secrets in logs/errors), **When** P3 completes, **Then** each area is marked Reviewed with findings or “none.”
2. **Given** a Critical/High finding, **When** P3 merges, **Then** it is fixed (or explicitly deferred only with written risk acceptance — default is fix).
3. **Given** Medium findings, **When** P3 merges, **Then** they appear as follow-up tasks/issues, not silently dropped.
4. **Given** production config, **When** e2e seed routes are considered, **Then** they remain disabled unless explicitly enabled and are not a production footgun.

---

### User Story 4 - Critical & Major maintainability smells (Priority: P4)

As a maintainer, I want Sonar Critical and Major code smells reduced so cognitive complexity and risky patterns stop hiding real defects.

**Why this priority**: 113 smells (~11 Critical, ~61 Major at last scan). Cleaning Critical+Major improves security review signal; Minor is triage-only.

**Independent Test**: After re-scan, Critical+Major open smells are fixed or explicitly accepted with notes; cheap Minors fixed opportunistically.

**Acceptance Scenarios**:

1. **Given** Sonar Critical smells, **When** P4 completes, **Then** each is fixed or documented as accepted with rationale.
2. **Given** Sonar Major smells, **When** P4 completes, **Then** each is fixed or documented as accepted with rationale.
3. **Given** Minor smells, **When** P4 completes, **Then** cheap ones may be fixed; remaining Minors may stay open with a short triage note.
4. **Given** smell batches, **When** shipped, **Then** they land in reviewable PR slices (by rule/area), not one undifferentiable dump if size explodes.

---

### Edge Cases

- What happens when `Content-Length` is missing but the multipart body is huge? → multer `fileSize` must still enforce 2 MB.
- What happens when magic bytes say PNG but sharp cannot decode? → reject with a clear invalid-image error.
- What happens when UI limit and API limit drift? → shared JSON is the single source; tests or import usage must prevent silent drift.
- What happens when backdrop is `aria-hidden` for visual overlay but still clickable? → dismiss control must remain keyboard-reachable and appropriately labeled.
- What happens if Sonar is down during a phase gate? → restart local SonarQube, re-run scanner with a user token, then evaluate metrics (gate is not waived by default).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST reject avatar uploads larger than 2 MB on the server.
- **FR-002**: System MUST reject avatar upload requests early when `Content-Length` is present and greater than 2 MB, or when `Content-Length` is non-numeric.
- **FR-003**: System MUST still enforce the 2 MB limit via multer when `Content-Length` is absent.
- **FR-004**: System MUST verify image magic bytes for allowed formats (JPEG, PNG, WebP, GIF) and MUST NOT trust client `mimetype` alone.
- **FR-005**: Frontend and backend MUST read max upload size (and related limit metadata) from `shared/avatarUploadLimits.json`.
- **FR-006**: Frontend MUST update helper copy to 2 MB and MUST block selection/`file.size` over the limit before upload.
- **FR-007**: System MUST keep existing MIME allowlist and sharp normalization pipeline for accepted avatars.
- **FR-008**: Dismissible overlays flagged by Sonar MUST use a real `<button type="button">` (or shared backdrop button component) for click-to-dismiss, with an accessible name.
- **FR-009**: P3 MUST produce a structured auth/Jira security review covering authn/authz, Jira OAuth/state/token storage, upload/static serving, e2e seed exposure, rate limits, and secret leakage in logs/errors.
- **FR-010**: P3 MUST fix Critical/High review findings in that phase’s PR(s); Medium findings MUST be tracked as follow-ups.
- **FR-011**: P4 MUST remediate Sonar Critical and Major code smells (fix or documented accept); Minor smells are triage-only.
- **FR-012**: Each phase PR MUST include automated tests for the behavior it changes (upload security tests in `server/tests/uploadAvatar.test.js` for P1; a11y/regression coverage appropriate for P2; tests for P3 fixes as applicable).
- **FR-013**: Each phase PR MUST pass its Sonar gate after re-scan (see Success Criteria).
- **FR-014**: Delivery MUST use separate PRs cut from `main` for P1→P2→P3→P4 (epic Speckit docs may live on `001-security-hardening`).

### Key Entities

- **Avatar upload limits**: Shared max bytes, human label, allowed MIME types, min source px guidance.
- **Avatar upload request**: Authenticated multipart upload to the current user profile.
- **Dismissible overlay**: Modal/drawer backdrop that currently closes on pointer click.
- **Security finding**: Review or Sonar issue with severity, location, status (open/fixed/accepted).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: SonarQube `vulnerabilities` for project `questly` = **0** after P1.
- **SC-002**: The four known Sonar a11y bugs are **absent** after P2.
- **SC-003**: After P3, no new Sonar High security issues are introduced; Critical/High review findings are fixed or explicitly risk-accepted in writing.
- **SC-004**: After P4, Sonar Critical + Major code smells are cleared or listed in an acceptances note in the epic folder.
- **SC-005**: Oversized and magic-byte-invalid avatar uploads are rejected in automated API tests with 100% pass on the new suite.
- **SC-006**: Frontend blocks >2 MB files before network upload in component tests or equivalent coverage.

## Assumptions

- Local SonarQube Community Build remains the analysis target (`http://127.0.0.1:9000`, project key `questly`); it may need a restart before gates.
- Scanner auth uses a user token stored locally (env), not committed.
- Existing sharp pipeline (`processAvatarImage`) remains the image normalization path after sniffing.
- Constitution file is still a Speckit template stub; this epic does not block on ratifying a full constitution (lightweight Speckit path).
- “Broad auth/Jira review” is checklist-driven engineering review of the current Express/React codebase, not a third-party pentest.
- Baseline Sonar snapshot (Aug 2026): 1 vulnerability, 4 bugs, 0 hotspots, ~113 smells (~11 Critical / ~61 Major / ~46 Minor).
