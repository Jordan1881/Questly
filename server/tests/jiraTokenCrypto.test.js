const {
  encryptToken,
  decryptToken,
  isEncrypted,
  PREFIX,
} = require('../lib/jiraTokenCrypto')

describe('jiraTokenCrypto', () => {
  const savedKey = process.env.JIRA_TOKEN_ENCRYPTION_KEY

  beforeEach(() => {
    process.env.JIRA_TOKEN_ENCRYPTION_KEY = 'test-encryption-secret'
  })

  afterEach(() => {
    if (savedKey === undefined) delete process.env.JIRA_TOKEN_ENCRYPTION_KEY
    else process.env.JIRA_TOKEN_ENCRYPTION_KEY = savedKey
  })

  test('encryptToken round-trips plaintext', () => {
    const encrypted = encryptToken('my-jira-token')
    expect(isEncrypted(encrypted)).toBe(true)
    expect(encrypted.startsWith(PREFIX)).toBe(true)
    expect(decryptToken(encrypted)).toBe('my-jira-token')
  })

  test('decryptToken returns legacy plaintext unchanged', () => {
    expect(decryptToken('legacy-plain-token')).toBe('legacy-plain-token')
    expect(isEncrypted('legacy-plain-token')).toBe(false)
  })

  test('encryptToken is no-op when encryption key is unset', () => {
    delete process.env.JIRA_TOKEN_ENCRYPTION_KEY
    expect(encryptToken('plain-only')).toBe('plain-only')
  })
})
