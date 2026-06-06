const https = require('https')
const { URL } = require('url')
const config = require('../config')
const { isJiraFallbackEnabled } = require('../lib/jiraConfig')
const { XP_BY_DIFFICULTY, calculateXP } = require('./xp')
const HIGH_PRIORITY_NAMES = new Set(['highest', 'high'])
const STORY_POINT_FIELD_NAMES = ['story point estimate', 'story points', 'story point']

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard'])

function mapJiraIssueToDifficulty(value) {
  if (value == null || value === '') return 'medium'

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (VALID_DIFFICULTIES.has(normalized)) return normalized
    throw new TypeError(`Unknown difficulty value: ${value}`)
  }

  const points = Number(value)
  if (Number.isNaN(points) || points <= 0) {
    throw new TypeError(`Unknown difficulty value: ${value}`)
  }
  if (points <= 2) return 'easy'
  if (points <= 5) return 'medium'
  return 'hard'
}

function parseDifficultyFromStoryPoints(storyPoints) {
  if (storyPoints == null || storyPoints === '') return 'medium'

  const points = Number(storyPoints)
  if (Number.isNaN(points) || points <= 0) return 'medium'
  return mapJiraIssueToDifficulty(points)
}

function extractStoryPoints(fields, storyPointsFieldId) {
  if (!fields || !storyPointsFieldId) return null

  const raw = fields[storyPointsFieldId]
  if (raw == null || raw === '') return null

  const points = Number(raw)
  return Number.isNaN(points) ? null : points
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

function jiraGet(path, { siteUrl, email, apiToken }) {
  const url = new URL(`${siteUrl}${path}`)

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        headers: {
          Authorization: buildAuthHeader(email, apiToken),
          Accept: 'application/json',
        },
      },
      (res) => {
        let text = ''
        res.on('data', (chunk) => {
          text += chunk
        })
        res.on('end', () => {
          let body
          try {
            body = text ? JSON.parse(text) : null
          } catch {
            body = text
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            const message =
              typeof body === 'object' && body?.errorMessages?.length
                ? body.errorMessages.join('; ')
                : `Jira request failed with HTTP ${res.statusCode}`
            const err = new Error(message)
            err.status = res.statusCode
            err.body = body
            reject(err)
            return
          }

          resolve(body)
        })
      },
    )

    req.on('error', reject)
    req.end()
  })
}

function getCredentials(overrides = {}) {
  const allowPlatformFallback = isJiraFallbackEnabled()
  const platform = allowPlatformFallback ? config.jira : {}
  const siteUrl = (overrides.siteUrl || platform.siteUrl || '').replace(/\/$/, '')
  const email = overrides.email || platform.adminEmail
  const apiToken = overrides.apiToken || platform.adminApiToken
  const projectKey = overrides.projectKey || platform.projectKey
  const storyPointsFieldId =
    overrides.storyPointsFieldId || platform.storyPointsFieldId || null

  if (!siteUrl || !email || !apiToken || !projectKey) {
    const err = new Error(
      allowPlatformFallback
        ? 'Jira is not configured — set JIRA_SITE_URL, JIRA_PROJECT_KEY, JIRA_ADMIN_EMAIL, and JIRA_ADMIN_API_TOKEN'
        : 'Workspace Jira is not connected — connect Jira in Admin before syncing tasks',
    )
    err.status = 503
    throw err
  }

  return { siteUrl, email, apiToken, projectKey, storyPointsFieldId }
}

async function resolveStoryPointsFieldId(credentials) {
  if (credentials.storyPointsFieldId) return credentials.storyPointsFieldId

  const fields = await jiraGet('/rest/api/3/field', credentials)
  const match = fields.find((field) =>
    STORY_POINT_FIELD_NAMES.some((name) => field.name?.toLowerCase().includes(name)),
  )

  return match?.id || null
}

async function fetchProjectIssues(overrides = {}) {
  const credentials = getCredentials(overrides)
  const { siteUrl, email, apiToken, projectKey } = credentials
  const storyPointsFieldId = await resolveStoryPointsFieldId(credentials)

  const fields = ['summary', 'description', 'status', 'assignee', 'duedate', 'priority', 'parent']
  if (storyPointsFieldId) fields.push(storyPointsFieldId)

  const jql = encodeURIComponent(`project = ${projectKey} ORDER BY updated DESC`)
  const fieldList = encodeURIComponent(fields.join(','))
  const body = await jiraGet(
    `/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=${fieldList}`,
    { siteUrl, email, apiToken },
  )

  return mapIssues(body.issues || [], storyPointsFieldId)
}

function mapIssues(issues, storyPointsFieldId) {
  const storyPointsByKey = new Map()

  for (const issue of issues) {
    const points = extractStoryPoints(issue.fields, storyPointsFieldId)
    if (points != null) {
      storyPointsByKey.set(issue.key, points)
    }
  }

  return issues.map((issue) => mapIssue(issue, storyPointsFieldId, storyPointsByKey))
}

function mapIssue(issue, storyPointsFieldId, storyPointsByKey = new Map()) {
  const fields = issue.fields || {}
  let storyPoints = extractStoryPoints(fields, storyPointsFieldId)

  if (storyPoints == null && fields.parent?.key) {
    storyPoints = storyPointsByKey.get(fields.parent.key) ?? null
  }

  const difficulty = parseDifficultyFromStoryPoints(storyPoints)

  return {
    jiraIssueId: issue.id,
    jiraIssueKey: issue.key,
    title: fields.summary || issue.key,
    description: typeof fields.description === 'string' ? fields.description : null,
    difficulty,
    storyPoints,
    xpReward: calculateXP(difficulty),
    dueDate: fields.duedate || null,
    highPriority: isHighPriority(fields.priority?.name),
    status: mapJiraStatus(fields.status?.name),
    assigneeAccountId: fields.assignee?.accountId || null,
  }
}

async function validateCredentials({ siteUrl, email, apiToken, projectKey }) {
  const credentials = {
    siteUrl: (siteUrl || '').replace(/\/$/, ''),
    email,
    apiToken,
  }

  if (!credentials.siteUrl || !credentials.email || !credentials.apiToken) {
    const err = new Error('siteUrl, email, and apiToken are required to validate Jira credentials')
    err.status = 400
    throw err
  }

  const myself = await jiraGet('/rest/api/3/myself', credentials)

  if (projectKey) {
    await jiraGet(`/rest/api/3/project/${encodeURIComponent(projectKey)}`, credentials)
  }

  return { accountId: myself.accountId || null }
}

async function lookupAccountIdByEmail(email, overrides = {}) {
  if (!email) return null

  let credentials
  try {
    credentials = getCredentials(overrides)
  } catch {
    return null
  }
  const { siteUrl, email: apiEmail, apiToken } = credentials
  const query = encodeURIComponent(email)
  let users
  try {
    users = await jiraGet(`/rest/api/3/user/search?query=${query}`, {
      siteUrl,
      email: apiEmail,
      apiToken,
    })
  } catch {
    return null
  }

  const match = (users || []).find(
    (user) => user.emailAddress?.toLowerCase() === email.toLowerCase(),
  )

  return match?.accountId || null
}

module.exports = {
  XP_BY_DIFFICULTY,
  calculateXP,
  STORY_POINT_FIELD_NAMES,
  fetchProjectIssues,
  validateCredentials,
  lookupAccountIdByEmail,
  mapIssue,
  mapIssues,
  mapJiraIssueToDifficulty,
  parseDifficultyFromStoryPoints,
  extractStoryPoints,
  resolveStoryPointsFieldId,
  mapJiraStatus,
  isHighPriority,
}
