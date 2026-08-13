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

  test('encryptToken is no-op when encryption key is unset outside production', () => {
    const savedEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    delete process.env.JIRA_TOKEN_ENCRYPTION_KEY
    expect(encryptToken('plain-only')).toBe('plain-only')
    process.env.NODE_ENV = savedEnv
  })

  test('encryptToken fails closed in production when encryption key is unset', () => {
    const savedEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    delete process.env.JIRA_TOKEN_ENCRYPTION_KEY
    expect(() => encryptToken('plain-only')).toThrow(/JIRA_TOKEN_ENCRYPTION_KEY/)
    process.env.NODE_ENV = savedEnv
  })
})
