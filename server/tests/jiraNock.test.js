const nock = require('nock')
const jiraClient = require('../services/jiraClient')
const {
  mockFullJiraSync,
  mockJiraMyself,
  mockJiraProject,
  mockJiraUserSearch,
  setupJiraEnv,
  cleanNock,
  assertNoPendingNock,
  DEFAULT_SITE,
} = require('./helpers/jiraNock')

describe('Jira HTTP via nock', () => {
  beforeEach(() => {
    cleanNock()
    setupJiraEnv()
  })

  afterEach(() => {
    cleanNock()
  })

  const credentials = {
    siteUrl: DEFAULT_SITE,
    email: 'admin@test.com',
    apiToken: 'test-token',
    projectKey: 'QUEST',
  }

  test('fetchProjectIssues intercepts field + search requests at the network level', async () => {
    mockFullJiraSync(credentials)

    const issues = await jiraClient.fetchProjectIssues(credentials)

    expect(issues).toHaveLength(2)
    expect(issues[0]).toMatchObject({
      jiraIssueKey: 'SCRUM-1',
      difficulty: 'easy',
      xpReward: 20,
    })
    expect(issues[1]).toMatchObject({
      jiraIssueKey: 'SCRUM-2',
      difficulty: 'hard',
      highPriority: true,
      assigneeAccountId: 'dev-jira-id',
    })
    assertNoPendingNock()
  })

  test('validateCredentials intercepts myself and project endpoints', async () => {
    mockJiraMyself(DEFAULT_SITE, 'acct-99')
    mockJiraProject(DEFAULT_SITE, 'QUEST')

    const result = await jiraClient.validateCredentials({
      siteUrl: DEFAULT_SITE,
      email: 'admin@test.com',
      apiToken: 'token',
      projectKey: 'QUEST',
    })

    expect(result.accountId).toBe('acct-99')
    assertNoPendingNock()
  })

  test('lookupAccountIdByEmail intercepts user search endpoint', async () => {
    mockJiraUserSearch(DEFAULT_SITE, [
      { accountId: 'lookup-id', emailAddress: 'dev@test.com' },
    ])

    const accountId = await jiraClient.lookupAccountIdByEmail('dev@test.com', credentials)

    expect(accountId).toBe('lookup-id')
    assertNoPendingNock()
  })

  test('lookupAccountIdByEmail returns null when Jira user search fails', async () => {
    nock(DEFAULT_SITE.replace(/\/$/, ''))
      .get('/rest/api/3/user/search')
      .query(true)
      .reply(404, { errorMessages: ['Site not found'] })

    const accountId = await jiraClient.lookupAccountIdByEmail('dev@test.com', credentials)

    expect(accountId).toBeNull()
    assertNoPendingNock()
  })

})

describe('lookupAccountIdByEmail without Jira config', () => {
  const savedEnv = {}

  beforeEach(() => {
    for (const key of [
      'JIRA_SITE_URL',
      'JIRA_PROJECT_KEY',
      'JIRA_ADMIN_EMAIL',
      'JIRA_ADMIN_API_TOKEN',
    ]) {
      savedEnv[key] = process.env[key]
      delete process.env[key]
    }
    jest.resetModules()
  })

  afterEach(() => {
    for (const key of [
      'JIRA_SITE_URL',
      'JIRA_PROJECT_KEY',
      'JIRA_ADMIN_EMAIL',
      'JIRA_ADMIN_API_TOKEN',
    ]) {
      if (savedEnv[key] === undefined) delete process.env[key]
      else process.env[key] = savedEnv[key]
    }
    jest.resetModules()
  })

  test('returns null when Jira is not configured', async () => {
    const { lookupAccountIdByEmail } = require('../services/jiraClient')
    const accountId = await lookupAccountIdByEmail('dev@test.com')
    expect(accountId).toBeNull()
  })
})
