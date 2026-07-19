const nock = require('nock')
const jiraClient = require('../services/jiraClient')

const SITE = 'https://test.atlassian.net'
const CREDENTIALS = { siteUrl: SITE, email: 'admin@test.com', apiToken: 'test-token' }

afterEach(() => {
  nock.cleanAll()
})

describe('jiraClient reliability', () => {
  test('times out a hung request instead of hanging forever', async () => {
    nock(SITE)
      .get('/rest/api/3/myself')
      .delayConnection(300)
      .reply(200, { accountId: 'x' })

    await expect(
      jiraClient.jiraGet('/rest/api/3/myself', CREDENTIALS, {
        timeoutMs: 40,
        maxRetries: 0,
      }),
    ).rejects.toMatchObject({ isTimeout: true })
  })

  test('retries transient 5xx and then succeeds', async () => {
    nock(SITE).get('/rest/api/3/myself').reply(503, { errorMessages: ['try later'] })
    nock(SITE).get('/rest/api/3/myself').reply(200, { accountId: 'acct-1' })

    const body = await jiraClient.jiraGet('/rest/api/3/myself', CREDENTIALS, {
      maxRetries: 2,
      retryBaseMs: 1,
    })

    expect(body).toEqual({ accountId: 'acct-1' })
    expect(nock.isDone()).toBe(true)
  })

  test('does NOT retry a 4xx client error', async () => {
    const scope = nock(SITE)
      .get('/rest/api/3/myself')
      .reply(404, { errorMessages: ['not found'] })

    await expect(
      jiraClient.jiraGet('/rest/api/3/myself', CREDENTIALS, { maxRetries: 3, retryBaseMs: 1 }),
    ).rejects.toMatchObject({ status: 404 })

    expect(scope.isDone()).toBe(true)
    expect(nock.pendingMocks()).toHaveLength(0)
  })

  test('isRetryable classifies errors correctly', () => {
    expect(jiraClient.isRetryable({ isTimeout: true })).toBe(true)
    expect(jiraClient.isRetryable({ code: 'ECONNRESET' })).toBe(true)
    expect(jiraClient.isRetryable({ status: 500 })).toBe(true)
    expect(jiraClient.isRetryable({ status: 404 })).toBe(false)
    expect(jiraClient.isRetryable(null)).toBe(false)
  })

  test('fetchProjectIssues pages through all results', async () => {
    nock(SITE)
      .get('/rest/api/3/field')
      .reply(200, [{ id: 'customfield_10016', name: 'Story point estimate' }])

    nock(SITE)
      .get('/rest/api/3/search/jql')
      .query(true)
      .reply(200, {
        isLast: false,
        nextPageToken: 'page-2',
        issues: [
          { id: '1', key: 'Q-1', fields: { summary: 'One', status: { name: 'To Do' } } },
        ],
      })

    nock(SITE)
      .get('/rest/api/3/search/jql')
      .query(true)
      .reply(200, {
        isLast: true,
        issues: [
          { id: '2', key: 'Q-2', fields: { summary: 'Two', status: { name: 'Done' } } },
        ],
      })

    const issues = await jiraClient.fetchProjectIssues({
      ...CREDENTIALS,
      projectKey: 'QUEST',
    })

    expect(issues.map((i) => i.jiraIssueKey)).toEqual(['Q-1', 'Q-2'])
    expect(nock.isDone()).toBe(true)
  })
})
