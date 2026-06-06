const { formatDeveloperConnectError } = require('../lib/jiraConnectErrors')

describe('formatDeveloperConnectError', () => {
  test('maps Jira 403 to invite message', () => {
    const message = formatDeveloperConnectError(
      Object.assign(new Error('Forbidden'), { status: 403 }),
      'https://acme.atlassian.net',
    )
    expect(message).toMatch(/invite your email/i)
  })
})
