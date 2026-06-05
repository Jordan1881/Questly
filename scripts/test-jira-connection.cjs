#!/usr/bin/env node
/**
 * Smoke-test Jira Cloud credentials from env (Cloud Agent secrets or server/.env).
 *
 * Usage:
 *   node scripts/test-jira-connection.cjs
 *   node scripts/test-jira-connection.cjs --role developer
 */

const path = require('path')
try {
  require(path.join(__dirname, '../server/node_modules/dotenv')).config({
    path: path.join(__dirname, '../server/.env'),
  })
} catch {
  // Cloud Agent injects secrets as env vars; dotenv only needed for local server/.env
}

const role = process.argv.includes('--role')
  ? process.argv[process.argv.indexOf('--role') + 1] || 'admin'
  : 'admin'

const siteUrl = (process.env.JIRA_SITE_URL || '').replace(/\/$/, '')
const projectKey = process.env.JIRA_PROJECT_KEY || ''
const email =
  role === 'developer'
    ? process.env.JIRA_DEVELOPER_EMAIL
    : process.env.JIRA_ADMIN_EMAIL
const apiToken =
  role === 'developer'
    ? process.env.JIRA_DEVELOPER_API_TOKEN
    : process.env.JIRA_ADMIN_API_TOKEN
const accountId = process.env.JIRA_DEVELOPER_ACCOUNT_ID
const difficultyField = process.env.JIRA_DIFFICULTY_FIELD_ID

function missing() {
  const required = ['JIRA_SITE_URL', 'JIRA_PROJECT_KEY']
  const roleRequired =
    role === 'developer'
      ? ['JIRA_DEVELOPER_EMAIL', 'JIRA_DEVELOPER_API_TOKEN']
      : ['JIRA_ADMIN_EMAIL', 'JIRA_ADMIN_API_TOKEN']

  return [...required, ...roleRequired].filter((key) => !process.env[key])
}

async function jiraGet(path) {
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64')
  const res = await fetch(`${siteUrl}${path}`, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
  })
  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { ok: res.ok, status: res.status, body }
}

async function main() {
  console.log(`\n🔍 Jira connection test (${role})\n`)

  const absent = missing()
  if (absent.length) {
    console.error('❌ Missing environment variables:')
    absent.forEach((key) => console.error(`   - ${key}`))
    console.error('\nAdd these as Cursor Cloud Agent secrets or in server/.env')
    process.exit(1)
  }

  console.log(`Site:    ${siteUrl}`)
  console.log(`Project: ${projectKey}`)
  console.log(`Email:   ${email}`)
  if (role === 'developer' && accountId) console.log(`Account: ${accountId}`)
  if (difficultyField) console.log(`Difficulty field: ${difficultyField}`)
  console.log()

  const myself = await jiraGet('/rest/api/3/myself')
  if (!myself.ok) {
    console.error(`❌ /myself failed — HTTP ${myself.status}`)
    console.error(JSON.stringify(myself.body, null, 2))
    process.exit(1)
  }
  console.log(`✅ Authenticated as ${myself.body.displayName} (${myself.body.emailAddress})`)

  const project = await jiraGet(`/rest/api/3/project/${projectKey}`)
  if (!project.ok) {
    console.error(`❌ Project ${projectKey} not found — HTTP ${project.status}`)
    console.error(JSON.stringify(project.body, null, 2))
    process.exit(1)
  }
  console.log(`✅ Project "${project.body.name}" (${project.body.key}) accessible`)

  const jql = encodeURIComponent(`project = ${projectKey} ORDER BY created DESC`)
  const search = await jiraGet(`/rest/api/3/search/jql?jql=${jql}&maxResults=3`)
  if (!search.ok) {
    console.error(`❌ JQL search failed — HTTP ${search.status}`)
    console.error(JSON.stringify(search.body, null, 2))
    process.exit(1)
  }

  const issues = search.body.issues || []
  console.log(`✅ JQL search returned ${issues.length} issue(s) (sample)`)
  issues.forEach((issue) => {
    console.log(`   - ${issue.key}: ${issue.fields?.summary ?? '(no summary)'}`)
  })

  console.log('\n✅ Jira API token is valid and project is reachable.\n')
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err.message)
  process.exit(1)
})
