const config = require('../config')

const XP_BY_DIFFICULTY = { easy: 20, medium: 40, hard: 70 }
const HIGH_PRIORITY_NAMES = new Set(['highest', 'high'])

function parseDifficulty(raw) {
  if (raw == null || raw === '') return 'medium'

  let value = raw
  if (typeof raw === 'object') {
    value = raw.value ?? raw.name ?? raw.displayName ?? ''
  }

  const normalized = String(value).toLowerCase()
  if (normalized.includes('easy')) return 'easy'
  if (normalized.includes('hard')) return 'hard'
  if (normalized.includes('medium')) return 'medium'
  return 'medium'
}

function mapJiraStatus(statusName) {
  const normalized = (statusName || '').toLowerCase()
  if (normalized.includes('done') || normalized.includes('complete')) return 'done'
  if (normalized.includes('progress')) return 'in_progress'
  return 'to_do'
}

function isHighPriority(priorityName) {
  return HIGH_PRIORITY_NAMES.has((priorityName || '').toLowerCase())
}

function buildAuthHeader(email, apiToken) {
  return `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`
}

async function jiraGet(path, { siteUrl, email, apiToken }) {
  const res = await fetch(`${siteUrl}${path}`, {
    headers: {
      Authorization: buildAuthHeader(email, apiToken),
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

  if (!res.ok) {
    const message =
      typeof body === 'object' && body?.errorMessages?.length
        ? body.errorMessages.join('; ')
        : `Jira request failed with HTTP ${res.status}`
    const err = new Error(message)
    err.status = res.status
    err.body = body
    throw err
  }

  return body
}

function getCredentials(overrides = {}) {
  const siteUrl = (overrides.siteUrl || config.jira.siteUrl || '').replace(/\/$/, '')
  const email = overrides.email || config.jira.adminEmail
  const apiToken = overrides.apiToken || config.jira.adminApiToken
  const projectKey = overrides.projectKey || config.jira.projectKey
  const difficultyFieldId = overrides.difficultyFieldId || config.jira.difficultyFieldId

  if (!siteUrl || !email || !apiToken || !projectKey) {
    const err = new Error('Jira is not configured — set JIRA_SITE_URL, JIRA_PROJECT_KEY, JIRA_ADMIN_EMAIL, and JIRA_ADMIN_API_TOKEN')
    err.status = 503
    throw err
  }

  return { siteUrl, email, apiToken, projectKey, difficultyFieldId }
}

async function fetchProjectIssues(overrides = {}) {
  const { siteUrl, email, apiToken, projectKey, difficultyFieldId } = getCredentials(overrides)

  const fields = ['summary', 'description', 'status', 'assignee', 'duedate', 'priority']
  if (difficultyFieldId) fields.push(difficultyFieldId)

  const jql = encodeURIComponent(`project = ${projectKey} ORDER BY updated DESC`)
  const fieldList = encodeURIComponent(fields.join(','))
  const body = await jiraGet(
    `/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=${fieldList}`,
    { siteUrl, email, apiToken },
  )

  return (body.issues || []).map((issue) => mapIssue(issue, difficultyFieldId))
}

function mapIssue(issue, difficultyFieldId) {
  const fields = issue.fields || {}
  const difficulty = parseDifficulty(difficultyFieldId ? fields[difficultyFieldId] : null)

  return {
    jiraIssueId: issue.id,
    jiraIssueKey: issue.key,
    title: fields.summary || issue.key,
    description: typeof fields.description === 'string' ? fields.description : null,
    difficulty,
    xpReward: XP_BY_DIFFICULTY[difficulty],
    dueDate: fields.duedate || null,
    highPriority: isHighPriority(fields.priority?.name),
    status: mapJiraStatus(fields.status?.name),
    assigneeAccountId: fields.assignee?.accountId || null,
  }
}

module.exports = {
  XP_BY_DIFFICULTY,
  fetchProjectIssues,
  mapIssue,
  parseDifficulty,
  mapJiraStatus,
  isHighPriority,
}
