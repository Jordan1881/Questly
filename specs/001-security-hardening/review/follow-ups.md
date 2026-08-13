# P3 Medium security follow-ups

Tracked from `review/auth-jira-checklist.md`. Not blocking epic gate.

| ID | Severity | Area | Summary | Suggested next step |
|----|----------|------|---------|---------------------|
| FU-01 | Medium | Authn | Register allows password length 1; change-password requires 8 | Align `register` / Zod schema to `MIN_PASSWORD_LENGTH` |
| FU-02 | Medium | Authn | Password change does not revoke existing JWTs | Add `token_version` on users + check in `verifyToken` |
| FU-03 | Medium | Authn | `JWT_SECRET` presence-only validation | Enforce min length/entropy at boot in production |
| FU-04 | Medium | Jira OAuth | Callback redirects include `err.message` / Atlassian descriptions | Map to stable error codes; avoid raw messages |
| FU-05 | Medium | Errors | `errorHandler` returns `err.message` on 500 | Generic client message; log server-side only |
