jest.mock('../services/jiraClient', () => ({
  lookupAccountIdByEmail: jest.fn(),
}))

function loadAssignee(env = {}) {
  process.env.JWT_SECRET = 'test-secret'
  delete process.env.JIRA_DEVELOPER_EMAIL
  delete process.env.JIRA_DEVELOPER_ACCOUNT_ID
  delete process.env.JIRA_ACCOUNT_ID
  Object.assign(process.env, env)

  jest.resetModules()
  return {
    resolveJiraAccountIdForUser: require('../services/jiraAssignee').resolveJiraAccountIdForUser,
    jiraClient: require('../services/jiraClient'),
  }
}

describe('resolveJiraAccountIdForUser', () => {
  test('returns existing jira_account_id on user', async () => {
    const { resolveJiraAccountIdForUser } = loadAssignee()
    const id = await resolveJiraAccountIdForUser({
      email: 'dev@test.com',
      jira_account_id: 'existing-id',
    })

    expect(id).toBe('existing-id')
  })

  test('uses configured developer email and account id', async () => {
    const { resolveJiraAccountIdForUser, jiraClient } = loadAssignee({
      JIRA_DEVELOPER_EMAIL: 'dev@test.com',
      JIRA_DEVELOPER_ACCOUNT_ID: 'configured-id',
    })

    const id = await resolveJiraAccountIdForUser({
      email: 'dev@test.com',
      jira_account_id: null,
    })

    expect(id).toBe('configured-id')
    expect(jiraClient.lookupAccountIdByEmail).not.toHaveBeenCalled()
  })

  test('falls back to Jira lookup by email', async () => {
    const { resolveJiraAccountIdForUser, jiraClient } = loadAssignee()
    jiraClient.lookupAccountIdByEmail.mockResolvedValue('lookup-id')

    const id = await resolveJiraAccountIdForUser({
      email: 'other@test.com',
      jira_account_id: null,
    })

    expect(id).toBe('lookup-id')
    expect(jiraClient.lookupAccountIdByEmail).toHaveBeenCalledWith('other@test.com', {})
  })
})
