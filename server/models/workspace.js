const crypto = require('crypto')
const db = require('../config/db')
const { encryptToken, decryptWorkspaceTokens } = require('../lib/jiraTokenCrypto')

const TABLE = 'workspaces'
const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PATCHABLE_FIELDS = ['name', 'jira_project_key', 'jira_site_url']

function randomCode(length = 8) {
  let code = ''
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    code += CODE_CHARSET[bytes[i] % CODE_CHARSET.length]
  }
  return code
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode()
    const existing = await db(TABLE).where({ code }).first()
    if (!existing) return code
  }
  throw new Error('Failed to generate unique workspace code')
}

async function create({ name, admin_id }) {
  const code = await generateUniqueCode()
  const [workspace] = await db(TABLE).insert({ name, admin_id, code }).returning('*')
  return workspace
}

async function findById(id) {
  const row = await db(TABLE).where({ id }).first()
  return decryptWorkspaceTokens(row)
}

async function findByCode(code) {
  const row = await db(TABLE).where({ code }).first()
  return decryptWorkspaceTokens(row)
}

async function findByAdminId(admin_id) {
  const row = await db(TABLE).where({ admin_id }).first()
  return decryptWorkspaceTokens(row)
}

async function update(id, fields) {
  const patch = {}
  for (const key of PATCHABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      patch[key] = fields[key]
    }
  }

  if (Object.keys(patch).length === 0) {
    return null
  }

  const [workspace] = await db(TABLE).where({ id }).update(patch).returning('*')
  return workspace ?? undefined
}

function normalizeSiteUrl(url) {
  return (url || '').trim().replace(/\/$/, '')
}

async function connectJira(id, { jira_site_url, jira_project_key, jira_access_token }) {
  const [workspace] = await db(TABLE)
    .where({ id })
    .update({
      jira_site_url: normalizeSiteUrl(jira_site_url),
      jira_project_key: (jira_project_key || '').trim(),
      jira_access_token: encryptToken(jira_access_token),
      jira_refresh_token: null,
      jira_cloud_id: null,
      jira_auth_type: 'api_token',
    })
    .returning('*')
  return decryptWorkspaceTokens(workspace) ?? undefined
}

async function connectJiraOAuth(
  id,
  {
    jira_site_url,
    jira_project_key,
    jira_access_token,
    jira_refresh_token = null,
    jira_cloud_id,
  },
) {
  const [workspace] = await db(TABLE)
    .where({ id })
    .update({
      jira_site_url: normalizeSiteUrl(jira_site_url),
      jira_project_key: (jira_project_key || '').trim(),
      jira_access_token: encryptToken(jira_access_token),
      jira_refresh_token: encryptToken(jira_refresh_token),
      jira_cloud_id: jira_cloud_id || null,
      jira_auth_type: 'oauth',
    })
    .returning('*')
  return decryptWorkspaceTokens(workspace) ?? undefined
}

async function updateOAuthTokens(id, { jira_access_token, jira_refresh_token = undefined }) {
  const patch = {
    jira_access_token: encryptToken(jira_access_token),
  }
  if (jira_refresh_token !== undefined) {
    patch.jira_refresh_token = encryptToken(jira_refresh_token)
  }

  const [workspace] = await db(TABLE).where({ id }).update(patch).returning('*')
  return decryptWorkspaceTokens(workspace) ?? undefined
}

async function disconnectJira(id) {
  const [workspace] = await db(TABLE)
    .where({ id })
    .update({
      jira_site_url: null,
      jira_project_key: null,
      jira_access_token: null,
      jira_refresh_token: null,
      jira_cloud_id: null,
      jira_auth_type: 'api_token',
    })
    .returning('*')
  return workspace ?? undefined
}

function isJiraConnected(workspace) {
  return Boolean(
    workspace?.jira_site_url && workspace?.jira_project_key && workspace?.jira_access_token,
  )
}

function sanitize(workspace) {
  if (!workspace) return null
  const { jira_access_token, jira_refresh_token, jira_cloud_id, ...safe } = workspace
  safe.jira_connected = isJiraConnected(workspace)
  return safe
}

module.exports = {
  create,
  findById,
  findByCode,
  findByAdminId,
  update,
  connectJira,
  connectJiraOAuth,
  updateOAuthTokens,
  disconnectJira,
  isJiraConnected,
  sanitize,
  PATCHABLE_FIELDS,
}
