#!/usr/bin/env node
/**
 * Repo-root wrapper — delegates to server/scripts (Railway deploys server/ as /app).
 *
 * Usage (local from repo root):
 *   WORKSPACE_ID=... node scripts/cleanup-duplicate-jira-tasks.cjs [--apply]
 *
 * On Railway API console (cwd /app):
 *   WORKSPACE_ID=... node scripts/cleanup-duplicate-jira-tasks.cjs [--apply]
 */

require('../server/scripts/cleanup-duplicate-jira-tasks.cjs')
