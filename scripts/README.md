# Questly scripts

## Operations (used in CI, deploy, or prod)

| Script | Usage |
|--------|-------|
| [test-jira-connection.cjs](./test-jira-connection.cjs) | Smoke-test Jira credentials — `node scripts/test-jira-connection.cjs` |
| [cleanup-duplicate-jira-tasks.cjs](./cleanup-duplicate-jira-tasks.cjs) | Repo-root wrapper for duplicate task cleanup (local) |
| [../server/scripts/cleanup-duplicate-jira-tasks.cjs](../server/scripts/cleanup-duplicate-jira-tasks.cjs) | **Railway console** — `npm run cleanup:duplicate-jira-tasks` |

See [DEPLOY.md](../DEPLOY.md) for Railway one-time cleanup commands.

## Dev tooling (`dev/`)

One-off GitHub backlog utilities — not used in CI or production:

| Script | Usage |
|--------|-------|
| [dev/enhance-github-issues.mjs](./dev/enhance-github-issues.mjs) | Bulk-enrich GitHub issues via `gh` CLI |
| [dev/create-s15-jira-ux-issues.mjs](./dev/create-s15-jira-ux-issues.mjs) | Create S15 Jira UX issues (already run) |
| [dev/issue-enrichments.mjs](./dev/issue-enrichments.mjs) | Data module for `enhance-github-issues.mjs` |
