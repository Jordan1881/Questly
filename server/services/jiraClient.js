const https = require('https')
const { URL } = require('url')
const config = require('../config')
const { isJiraFallbackEnabled } = require('../lib/jiraConfig')
const { TTLCache } = require('../lib/cache')
const { XP_BY_DIFFICULTY, calculateXP } = require('./xp')

// The set of Jira custom fields for a site changes rarely, but field discovery
// costs a full extra round-trip on every sync. Cache the resolved story-points
// field id per site for a short TTL. Disabled under test so nock expectations
// (which assert the field endpoint is hit per sync) stay deterministic.
const FIELD_CACHE_TTL_MS = Number(process.env.JIRA_FIELD_CACHE_TTL_MS) || 300000
const fieldCache = new TTLCache({ defaultTtlMs: FIELD_CACHE_TTL_MS })

function fieldCacheEnabled() {
  return process.env.NODE_ENV !== 'test' && FIELD_CACHE_TTL_MS > 0
}
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

function resolveJiraRequest(path, credentials) {
  if (credentials.bearerToken && credentials.cloudId) {
    const url = new URL(`https://api.atlassian.com/ex/jira/${credentials.cloudId}${path}`)
    return {
      url,
      headers: {
        Authorization: `Bearer ${credentials.bearerToken}`,
        Accept: 'application/json',
      },
    }
  }

  const siteUrl = (credentials.siteUrl || '').replace(/\/$/, '')
  const url = new URL(`${siteUrl}${path}`)
  return {
    url,
    headers: {
      Authorization: buildAuthHeader(credentials.email, credentials.apiToken),
      Accept: 'application/json',
    },
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Retry only on transient failures: timeouts, dropped connections, and Jira 5xx.
// Client errors (4xx) are deterministic and must NOT be retried.
function isRetryable(err) {
  if (!err) return false
  if (err.isTimeout) return true
  if (['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN', 'EPIPE'].includes(err.code)) {
    return true
  }
  return typeof err.status === 'number' && err.status >= 500
}

// Single outbound Jira GET with a hard timeout so a hung Atlassian endpoint can
// never hang a Questly request indefinitely. The timer aborts the socket and
// settles the promise regardless of transport, so it is deterministic to test.
function jiraGetOnce(path, credentials, timeoutMs) {
  const { url, headers } = resolveJiraRequest(path, credentials)

  return new Promise((resolve, reject) => {
    let settled = false
    let timer = null

    const finish = (fn, value) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      fn(value)
    }

    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        headers,
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
            finish(reject, err)
            return
          }

          finish(resolve, body)
        })
      },
    )

    timer = setTimeout(() => {
      const err = new Error(`Jira request timed out after ${timeoutMs}ms`)
      err.code = 'ETIMEDOUT'
      err.isTimeout = true
      req.destroy(err)
      finish(reject, err)
    }, timeoutMs)
    if (typeof timer.unref === 'function') timer.unref()

    req.on('error', (err) => finish(reject, err))
    req.end()
  })
}

// Public GET with timeout + exponential-backoff retry for idempotent reads.
async function jiraGet(path, credentials, options = {}) {
  const timeoutMs = options.timeoutMs ?? config.jira.requestTimeoutMs
  const maxRetries = options.maxRetries ?? config.jira.maxRetries
  const baseDelayMs = options.retryBaseMs ?? (Number(process.env.JIRA_RETRY_BASE_MS) || 200)

  let attempt = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await jiraGetOnce(path, credentials, timeoutMs)
    } catch (err) {
      if (attempt >= maxRetries || !isRetryable(err)) throw err
      await sleep(Math.min(baseDelayMs * 2 ** attempt, 4000))
      attempt += 1
    }
  }
}

function getCredentials(overrides = {}) {
  const allowPlatformFallback = isJiraFallbackEnabled()
  const platform = allowPlatformFallback ? config.jira : {}
  const siteUrl = (overrides.siteUrl || platform.siteUrl || '').replace(/\/$/, '')
  const email = overrides.email || platform.adminEmail
  const apiToken = overrides.apiToken || platform.adminApiToken
  const projectKey = overrides.projectKey || platform.projectKey
  const bearerToken = overrides.bearerToken || null
  const cloudId = overrides.cloudId || null
  const storyPointsFieldId =
    overrides.storyPointsFieldId || platform.storyPointsFieldId || null

  if (bearerToken && cloudId && siteUrl) {
    return { siteUrl, projectKey: projectKey || null, bearerToken, cloudId, storyPointsFieldId }
  }

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

  const load = async () => {
    const fields = await jiraGet('/rest/api/3/field', credentials)
    const match = fields.find((field) =>
      STORY_POINT_FIELD_NAMES.some((name) => field.name?.toLowerCase().includes(name)),
    )
    return match?.id || null
  }

  if (!fieldCacheEnabled()) return load()

  const key = `spfield:${credentials.cloudId || credentials.siteUrl || 'default'}`
  return fieldCache.getOrLoad(key, load)
}

async function fetchProjectIssues(overrides = {}) {
  const credentials = getCredentials(overrides)
  const { projectKey } = credentials
  const storyPointsFieldId = await resolveStoryPointsFieldId(credentials)

  const fields = ['summary', 'description', 'status', 'assignee', 'duedate', 'priority', 'parent']
  if (storyPointsFieldId) fields.push(storyPointsFieldId)

  const jql = encodeURIComponent(`project = ${projectKey} ORDER BY updated DESC`)
  const fieldList = encodeURIComponent(fields.join(','))
  const pageSize = config.jira.pageSize

  // Token-based pagination: keep fetching until Jira reports the last page.
  // Without this, a project with more than one page silently syncs only page 1.
  const collected = []
  let nextPageToken = null
  let pages = 0
  const MAX_PAGES = 1000

  do {
    const tokenParam = nextPageToken
      ? `&nextPageToken=${encodeURIComponent(nextPageToken)}`
      : ''
    const body = await jiraGet(
      `/rest/api/3/search/jql?jql=${jql}&maxResults=${pageSize}&fields=${fieldList}${tokenParam}`,
      credentials,
    )

    const issues = body?.issues || []
    collected.push(...issues)

    nextPageToken = body && body.isLast !== true && body.nextPageToken ? body.nextPageToken : null
    pages += 1
  } while (nextPageToken && pages < MAX_PAGES)

  return mapIssues(collected, storyPointsFieldId)
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

async function listProjects(overrides = {}) {
  const credentials = getCredentials(overrides)
  const raw = await jiraGet('/rest/api/3/project', credentials)
  const projects = Array.isArray(raw) ? raw : raw?.values || []
  return projects.map((project) => ({
    key: project.key,
    name: project.name || project.key,
  }))
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
  listProjects,
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
  jiraGet,
  isRetryable,
}
