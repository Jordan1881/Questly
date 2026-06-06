const nock = require('nock')

const DEFAULT_SITE = 'https://test.atlassian.net'
const STORY_POINTS_FIELD_ID = 'customfield_10016'

function normalizeSite(siteUrl = DEFAULT_SITE) {
  return siteUrl.replace(/\/$/, '')
}

function mockJiraFields(siteUrl = DEFAULT_SITE, fieldId = STORY_POINTS_FIELD_ID) {
  return nock(normalizeSite(siteUrl))
    .get('/rest/api/3/field')
    .reply(200, [{ id: fieldId, name: 'Story point estimate' }])
}

function mockJiraSearch(siteUrl = DEFAULT_SITE, _projectKey = 'QUEST', issues = []) {
  return nock(normalizeSite(siteUrl))
    .get('/rest/api/3/search/jql')
    .query(true)
    .reply(200, { issues })
}

function mockJiraMyself(siteUrl = DEFAULT_SITE, accountId = 'jira-acct-1') {
  return nock(normalizeSite(siteUrl))
    .get('/rest/api/3/myself')
    .reply(200, { accountId, emailAddress: 'admin@test.com' })
}

function mockJiraProject(siteUrl = DEFAULT_SITE, projectKey = 'QUEST') {
  return nock(normalizeSite(siteUrl))
    .get(`/rest/api/3/project/${encodeURIComponent(projectKey)}`)
    .reply(200, { key: projectKey, name: 'Questly Test' })
}

function mockJiraUserSearch(siteUrl = DEFAULT_SITE, users = []) {
  return nock(normalizeSite(siteUrl))
    .get('/rest/api/3/user/search')
    .query(true)
    .reply(200, users)
}

function mockFullJiraSync({
  siteUrl = DEFAULT_SITE,
  projectKey = 'QUEST',
  issues = defaultRawIssues(),
} = {}) {
  mockJiraFields(siteUrl)
  mockJiraSearch(siteUrl, projectKey, issues)
  return { siteUrl: normalizeSite(siteUrl), projectKey }
}

function defaultRawIssues() {
  return [
    {
      id: '10001',
      key: 'SCRUM-1',
      fields: {
        summary: 'Task 1',
        description: 'First task',
        status: { name: 'To Do' },
        priority: { name: 'Medium' },
        duedate: '2026-03-10',
        [STORY_POINTS_FIELD_ID]: 2,
      },
    },
    {
      id: '10002',
      key: 'SCRUM-2',
      fields: {
        summary: 'Task 2',
        description: 'Second task',
        status: { name: 'In Progress' },
        priority: { name: 'High' },
        duedate: '2026-03-12',
        assignee: { accountId: 'dev-jira-id' },
        [STORY_POINTS_FIELD_ID]: 8,
      },
    },
  ]
}

function setupJiraEnv(overrides = {}) {
  process.env.JIRA_SITE_URL = overrides.siteUrl || DEFAULT_SITE
  process.env.JIRA_PROJECT_KEY = overrides.projectKey || 'QUEST'
  process.env.JIRA_ADMIN_EMAIL = overrides.email || 'admin@test.com'
  process.env.JIRA_ADMIN_API_TOKEN = overrides.apiToken || 'test-token'
  if (overrides.storyPointsFieldId) {
    process.env.JIRA_STORY_POINTS_FIELD_ID = overrides.storyPointsFieldId
  } else {
    delete process.env.JIRA_STORY_POINTS_FIELD_ID
  }
}

function cleanNock() {
  nock.cleanAll()
}

function assertNoPendingNock() {
  if (!nock.isDone()) {
    const pending = nock.pendingMocks()
    throw new Error(`Pending nock mocks: ${pending.join(', ')}`)
  }
}

module.exports = {
  DEFAULT_SITE,
  STORY_POINTS_FIELD_ID,
  mockJiraFields,
  mockJiraSearch,
  mockJiraMyself,
  mockJiraProject,
  mockJiraUserSearch,
  mockFullJiraSync,
  defaultRawIssues,
  setupJiraEnv,
  cleanNock,
  assertNoPendingNock,
}
