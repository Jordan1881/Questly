# Quickstart: Security epic verification

## Prerequisites

- Questly repo on branch for the phase PR (cut from `main`), typically `001-security-hardening`
- Local SonarQube 26.8 (`/Users/jordan/sonarqube`, **JDK 21**):

```bash
export SONAR_JAVA_PATH=/opt/homebrew/opt/openjdk@21/bin/java
# preferred helper:
/Users/jordan/sonarqube/start-sonarqube.sh
# or:
# $SONAR_JAVA_PATH /Users/jordan/sonarqube/bin/macosx-universal-64/sonar.sh console
curl -s http://127.0.0.1:9000/api/system/status
```

- Sonar user token in env only (never commit; revoke any token pasted in chat):

```bash
export SONAR_TOKEN='squ_…'
```

## Shared scan command

```bash
cd "/path/to/Questly_Development"
sonar-scanner \
  -Dsonar.host.url=http://127.0.0.1:9000 \
  -Dsonar.token="$SONAR_TOKEN" \
  -Dsonar.qualitygate.wait=false
```

Dashboard: http://127.0.0.1:9000/dashboard?id=questly

## P1 verify (avatar upload)

```bash
cd server && npm test -- --testPathPatterns=uploadAvatar --coverage=false
cd .. && npx vitest run src/tests/components/EditProfileForm.test.jsx
# Sonar: vulnerabilities = 0
```

## P2 verify (a11y dismiss)

```bash
npx vitest run \
  src/tests/components/Sidebar.test.jsx \
  src/tests/components/motion/AnimatedModal.test.jsx \
  src/tests/overlays/PurchaseConfirm.test.jsx \
  src/tests/overlays/JiraAuth.test.jsx
# Sonar: prior four a11y bugs = 0
```

Keyboard-dismiss: Sidebar, AnimatedModal, PurchaseConfirm, JiraAuth (`Dismiss` / `Dismiss menu`).

## P3 verify (auth / Jira)

- Checklist: `specs/001-security-hardening/review/auth-jira-checklist.md`
- Medium follow-ups: `specs/001-security-hardening/review/follow-ups.md`

```bash
cd server && npm test -- --testPathPatterns='auth.middleware|jiraTokenCrypto|e2eSeed.gate' --coverage=false
# Sonar: no new High security issues / vulnerabilities = 0
```

## P4 verify (smells)

- Export: `specs/001-security-hardening/sonar-critical-major-smells.md`
- Accepts: `specs/001-security-hardening/acceptances.md`

```bash
# After fixes, re-scan; Critical+Major cleared or accepted
```

## Useful URLs

- Dashboard: http://127.0.0.1:9000/dashboard?id=questly
- Issues: http://127.0.0.1:9000/project/issues?id=questly
