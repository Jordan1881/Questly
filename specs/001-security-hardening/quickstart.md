# Quickstart: Security epic verification

## Prerequisites

- Questly repo on branch for the phase PR (cut from `main`)
- Local SonarQube running (`/Users/jordan/sonarqube`, JDK 21):

```bash
export SONAR_JAVA_PATH=/opt/homebrew/opt/openjdk@21/bin/java
/Users/jordan/sonarqube/bin/macosx-universal-64/sonar.sh start
curl -s http://127.0.0.1:9000/api/system/status
```

- Sonar user token in env (never commit):

```bash
export SONAR_TOKEN='squ_…'
```

## P1 verify

```bash
cd server && npm test -- uploadAvatar.test.js
cd .. && npm test -- EditProfileForm   # or targeted vitest path once FE deps installed
sonar-scanner -Dsonar.token="$SONAR_TOKEN"
# Expect: vulnerabilities = 0 for component questly
```

## P2 verify

- Keyboard-dismiss each of: Sidebar overlay, AnimatedModal, PurchaseConfirm, JiraAuth
- Re-scan; confirm the four prior a11y bugs are gone

## P3 verify

- Checklist completed under `specs/001-security-hardening/review/`
- Critical/High fixes tested; Medium follow-ups filed
- Re-scan for new High security issues

## P4 verify

- Critical+Major smells fixed or listed in `acceptances.md`
- Re-scan gate

## Useful URLs

- Dashboard: http://127.0.0.1:9000/dashboard?id=questly
- Issues: http://127.0.0.1:9000/project/issues?id=questly
