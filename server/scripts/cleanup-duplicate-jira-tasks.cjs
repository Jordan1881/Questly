#!/usr/bin/env node
/**
 * Remove duplicate Jira task rows from Postgres (prod-safe dry-run by default).
 *
 * Keeps tasks in the canonical WORKSPACE_ID and deletes:
 * 1. Cross-workspace duplicates (same jira_issue_key in other workspaces)
 * 2. Intra-workspace duplicates (same jira_issue_key twice in canonical workspace)
 *
 * Usage (Railway API service console — cwd is /app = server/):
 *   WORKSPACE_ID=5aa54d45-06ea-4226-a0d4-1523d575ed2f node scripts/cleanup-duplicate-jira-tasks.cjs
 *   WORKSPACE_ID=... node scripts/cleanup-duplicate-jira-tasks.cjs --apply
 *
 * Or: npm run cleanup:duplicate-jira-tasks -- --apply
 */

require('dotenv').config()

const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'questly_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
})

const apply = process.argv.includes('--apply')
const workspaceId =
  process.env.WORKSPACE_ID ||
  process.argv.find((arg) => arg.startsWith('--workspace='))?.split('=')[1]

if (!workspaceId) {
  console.error('WORKSPACE_ID is required (env or --workspace=<uuid>)')
  process.exit(1)
}

async function pickKeeper(rows) {
  const sorted = [...rows].sort((a, b) => {
    const aTime = new Date(a.updated_at).getTime()
    const bTime = new Date(b.updated_at).getTime()
    return bTime - aTime
  })
  return sorted[0]
}

async function findIntraWorkspaceDuplicates() {
  const keys = await knex('tasks')
    .where({ workspace_id: workspaceId })
    .whereNotNull('jira_issue_key')
    .groupBy('jira_issue_key')
    .havingRaw('count(*) > 1')
    .select('jira_issue_key')

  const toDelete = []

  for (const { jira_issue_key: key } of keys) {
    const rows = await knex('tasks').where({ workspace_id: workspaceId, jira_issue_key: key })
    const keeper = await pickKeeper(rows)
    for (const row of rows) {
      if (row.id !== keeper.id) toDelete.push(row)
    }
  }

  return toDelete
}

async function findCrossWorkspaceDuplicates() {
  const canonicalKeys = await knex('tasks')
    .where({ workspace_id: workspaceId })
    .whereNotNull('jira_issue_key')
    .pluck('jira_issue_key')

  if (!canonicalKeys.length) return []

  return knex('tasks')
    .whereIn('jira_issue_key', canonicalKeys)
    .whereNot('workspace_id', workspaceId)
    .select('id', 'workspace_id', 'jira_issue_key', 'jira_issue_id', 'title', 'updated_at')
}

async function main() {
  const workspace = await knex('workspaces').where({ id: workspaceId }).first()
  if (!workspace) {
    console.error(`Workspace not found: ${workspaceId}`)
    process.exit(1)
  }

  console.log(`Canonical workspace: ${workspace.name} (${workspaceId})`)
  console.log(apply ? 'Mode: APPLY (will delete rows)' : 'Mode: DRY RUN (pass --apply to delete)')

  const intra = await findIntraWorkspaceDuplicates()
  const cross = await findCrossWorkspaceDuplicates()
  const toDelete = [...intra, ...cross]

  if (!toDelete.length) {
    console.log('No duplicate Jira tasks found.')
    await knex.destroy()
    return
  }

  console.log(`Found ${toDelete.length} duplicate task row(s):`)
  for (const row of toDelete) {
    console.log(
      `  - ${row.jira_issue_key} (${row.id}) workspace=${row.workspace_id} updated=${row.updated_at}`,
    )
  }

  if (!apply) {
    console.log('\nRe-run with --apply to delete these rows (task_assignments cascade).')
    await knex.destroy()
    return
  }

  const ids = toDelete.map((row) => row.id)
  const deleted = await knex('tasks').whereIn('id', ids).del()
  console.log(`\nDeleted ${deleted} task row(s).`)
  await knex.destroy()
}

main().catch((err) => {
  console.error(err)
  knex.destroy().finally(() => process.exit(1))
})
