const crypto = require('crypto')

const PREFIX = 'enc:v1:'
const IV_BYTES = 12
const TAG_BYTES = 16

function encryptionKey() {
  const secret = process.env.JIRA_TOKEN_ENCRYPTION_KEY
  if (!secret) return null
  return crypto.createHash('sha256').update(secret).digest()
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX)
}

function encryptToken(plaintext) {
  if (plaintext == null || plaintext === '') return plaintext

  const key = encryptionKey()
  if (!key) return plaintext
  if (isEncrypted(plaintext)) return plaintext

  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const payload = Buffer.concat([iv, tag, ciphertext]).toString('base64')

  return `${PREFIX}${payload}`
}

function decryptToken(value) {
  if (value == null || value === '') return value
  if (!isEncrypted(value)) return value

  const key = encryptionKey()
  if (!key) {
    throw new Error('JIRA_TOKEN_ENCRYPTION_KEY is required to decrypt stored Jira tokens')
  }

  const raw = Buffer.from(value.slice(PREFIX.length), 'base64')
  const iv = raw.subarray(0, IV_BYTES)
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES)
  const ciphertext = raw.subarray(IV_BYTES + TAG_BYTES)

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])

  return plaintext.toString('utf8')
}

function decryptUserTokens(user) {
  if (!user) return user
  return {
    ...user,
    jira_access_token: decryptToken(user.jira_access_token),
    jira_refresh_token: decryptToken(user.jira_refresh_token),
  }
}

function decryptWorkspaceTokens(workspace) {
  if (!workspace) return workspace
  return {
    ...workspace,
    jira_access_token: decryptToken(workspace.jira_access_token),
    jira_refresh_token: decryptToken(workspace.jira_refresh_token),
  }
}

module.exports = {
  PREFIX,
  encryptToken,
  decryptToken,
  isEncrypted,
  decryptUserTokens,
  decryptWorkspaceTokens,
}
