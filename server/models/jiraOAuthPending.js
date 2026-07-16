const db = require('../config/db')
const { encryptToken, decryptToken } = require('../lib/jiraTokenCrypto')

const TTL_MS = 15 * 60 * 1000

function defaultExpiresAt() {
  return new Date(Date.now() + TTL_MS)
}

function mapRow(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    accessToken: decryptToken(row.access_token),
    refreshToken: decryptToken(row.refresh_token),
    expiresAt: row.expires_at,
    selectedSiteUrl: row.selected_site_url,
    selectedCloudId: row.selected_cloud_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function upsert({
  userId,
  workspaceId,
  accessToken,
  refreshToken = null,
  expiresAt = defaultExpiresAt(),
}) {
  const payload = {
    user_id: userId,
    workspace_id: workspaceId,
    access_token: encryptToken(accessToken),
    refresh_token: refreshToken != null ? encryptToken(refreshToken) : null,
    expires_at: expiresAt,
    selected_site_url: null,
    selected_cloud_id: null,
    updated_at: db.fn.now(),
  }

  const existing = await db('jira_oauth_pending')
    .where({ user_id: userId, workspace_id: workspaceId })
    .first()

  if (existing) {
    const [row] = await db('jira_oauth_pending')
      .where({ id: existing.id })
      .update(payload)
      .returning('*')
    return mapRow(row)
  }

  const [row] = await db('jira_oauth_pending').insert(payload).returning('*')
  return mapRow(row)
}

async function findRaw(userId, workspaceId) {
  return db('jira_oauth_pending')
    .where({ user_id: userId, workspace_id: workspaceId })
    .first()
}

async function deleteFor(userId, workspaceId) {
  await db('jira_oauth_pending')
    .where({ user_id: userId, workspace_id: workspaceId })
    .del()
}

/**
 * Status for HTTP: pending | expired | missing.
 * Expired rows are deleted.
 */
async function getStatus(userId, workspaceId) {
  const raw = await findRaw(userId, workspaceId)
  if (!raw) return { status: 'missing' }

  if (new Date(raw.expires_at).getTime() <= Date.now()) {
    await deleteFor(userId, workspaceId)
    return { status: 'expired' }
  }

  return {
    status: 'pending',
    expires_at: new Date(raw.expires_at).toISOString(),
  }
}

/**
 * Returns a usable pending session, or null.
 * Expired rows are deleted and treated as missing.
 */
async function findUsable(userId, workspaceId) {
  const row = await findRaw(userId, workspaceId)
  if (!row) return null

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await deleteFor(userId, workspaceId)
    return null
  }

  return mapRow(row)
}


module.exports = {
  TTL_MS,
  upsert,
  findUsable,
  findRaw,
  deleteFor,
  getStatus,
  defaultExpiresAt,
}
