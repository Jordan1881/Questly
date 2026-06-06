const { formatDeveloperConnectError } = require('../lib/jiraConnectErrors')

describe('formatDeveloperConnectError', () => {
  test('maps Jira 401 to actionable message with site host', () => {
    const message = formatDeveloperConnectError(
      Object.assign(new Error('Unauthorized'), { status: 401 }),
      'https://acme.atlassian.net',
    )
    expect(message).toMatch(/acme\.atlassian\.net/i)
    expect(message).toMatch(/same email as Questly/i)
    expect(message).not.toMatch(/HTTP 401/)
  })

  test('maps Jira 403 to invite message', () => {
    const message = formatDeveloperConnectError(
      Object.assign(new Error('Forbidden'), { status: 403 }),
      'https://acme.atlassian.net',
    )
    expect(message).toMatch(/invite your email/i)
  })
})
