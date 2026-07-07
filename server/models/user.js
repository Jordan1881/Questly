const db = require('../config/db')
const { encryptToken, decryptUserTokens } = require('../lib/jiraTokenCrypto')
const { parsePreferences, mergePreferences } = require('../lib/userPreferences')

const TABLE = 'users'
const PUBLIC_FIELDS = [
  'id',
  'email',
  'username',
  'role',
  'avatar_url',
  'workspace_id',
  'current_sprint_xp',
  'lifetime_xp',
  'coin_balance',
  'streak_days',
  'last_activity_date',
  'age',
  'preferences',
]

function strip(user) {
  if (!user) return null
  const { password_hash, jira_access_token, jira_refresh_token, jira_account_id, ...safe } = user
  return safe
}

async function findByEmail(email) {
  const row = await db(TABLE).where({ email }).first()
  return decryptUserTokens(row)
}

async function findById(id) {
  const user = await db(TABLE).where({ id }).first()
  return strip(user)
}

async function create({ email, username, password_hash, role }) {
  const [user] = await db(TABLE)
    .insert({ email, username, password_hash, role })
    .returning('*')
  return strip(user)
}

async function listByWorkspace(workspace_id) {
  return db(TABLE).where({ workspace_id }).select(PUBLIC_FIELDS)
}

async function listDevelopersByWorkspace(workspace_id) {
  const rows = await db(TABLE).where({ workspace_id, role: 'developer' })
  return rows.map(decryptUserTokens)
}

async function findByJiraAccountId(jira_account_id, workspace_id) {
  return db(TABLE).where({ jira_account_id, workspace_id }).first()
}

async function findByIdInternal(id) {
  const row = await db(TABLE).where({ id }).first()
  return decryptUserTokens(row)
}

async function assignWorkspace(user_id, workspace_id) {
  const [user] = await db(TABLE).where({ id: user_id }).update({ workspace_id }).returning('*')
  return strip(user)
}

async function updateJiraAccountId(user_id, jira_account_id) {
  const [user] = await db(TABLE)
    .where({ id: user_id })
    .update({
      jira_account_id,
      jira_personal_data_updated_at: db.fn.now(),
    })
    .returning('*')
  return strip(user)
}

async function connectJira(
  user_id,
  { jira_access_token, jira_account_id, jira_refresh_token = undefined },
) {
  const patch = {
    jira_access_token: encryptToken(jira_access_token),
    jira_account_id,
    jira_personal_data_updated_at: db.fn.now(),
  }
  if (jira_refresh_token !== undefined) {
    patch.jira_refresh_token = encryptToken(jira_refresh_token)
  }

  const [user] = await db(TABLE).where({ id: user_id }).update(patch).returning('*')
  return strip(decryptUserTokens(user))
}

async function disconnectJira(user_id) {
  const [user] = await db(TABLE)
    .where({ id: user_id })
    .update({
      jira_access_token: null,
      jira_refresh_token: null,
      jira_account_id: null,
      jira_personal_data_updated_at: null,
    })
    .returning('*')
  return strip(user)
}

async function listUsersWithJiraPersonalData() {
  const rows = await db(TABLE)
    .whereNotNull('jira_account_id')
    .whereNot('jira_account_id', '')
    .select('id', 'jira_account_id', 'jira_personal_data_updated_at', 'jira_access_token', 'jira_refresh_token')

  return rows.map(decryptUserTokens)
}

async function findByJiraAccountIdGlobal(jira_account_id) {
  const row = await db(TABLE).where({ jira_account_id }).first()
  return decryptUserTokens(row)
}

async function touchJiraPersonalDataUpdatedAt(user_id) {
  await db(TABLE).where({ id: user_id }).update({ jira_personal_data_updated_at: db.fn.now() })
}

async function eraseJiraPersonalData(user_id) {
  return disconnectJira(user_id)
}

function isJiraConnected(user) {
  return Boolean(user?.jira_access_token)
}

function formatPublicProfile(user) {
  const safe = strip(user)
  if (!safe) return null

  return {
    id: safe.id,
    email: safe.email,
    username: safe.username,
    role: safe.role,
    avatarUrl: safe.avatar_url,
    workspaceId: safe.workspace_id,
    currentSprintXp: safe.current_sprint_xp ?? 0,
    lifetimeXp: safe.lifetime_xp ?? 0,
    coinBalance: safe.coin_balance ?? 0,
    streakDays: safe.streak_days ?? 0,
    jiraConnected: isJiraConnected(user),
    age: safe.age ?? null,
    preferences: parsePreferences(safe.preferences),
  }
}

async function findByUsername(username, excludeUserId = null) {
  let query = db(TABLE).where({ username })
  if (excludeUserId) query = query.whereNot({ id: excludeUserId })
  return query.first()
}

async function updateProfile(
  user_id,
  { username, avatarUrl, avatar_url, email, age, preferences },
) {
  const patch = {}
  const nextUsername = username
  const nextAvatar = avatarUrl ?? avatar_url

  if (nextUsername !== undefined) patch.username = nextUsername
  if (nextAvatar !== undefined) patch.avatar_url = nextAvatar
  if (email !== undefined) patch.email = email
  if (age !== undefined) patch.age = age
  if (preferences !== undefined) {
    const current = await db(TABLE).where({ id: user_id }).select('preferences').first()
    patch.preferences = mergePreferences(current?.preferences, preferences)
  }

  if (!Object.keys(patch).length) {
    return findByIdInternal(user_id)
  }

  const [user] = await db(TABLE).where({ id: user_id }).update(patch).returning('*')
  return user
}

async function updatePassword(user_id, password_hash) {
  const [user] = await db(TABLE).where({ id: user_id }).update({ password_hash }).returning('*')
  return user
}

module.exports = {
  findByEmail,
  findById,
  findByIdInternal,
  create,
  listByWorkspace,
  listDevelopersByWorkspace,
  findByJiraAccountId,
  findByJiraAccountIdGlobal,
  listUsersWithJiraPersonalData,
  touchJiraPersonalDataUpdatedAt,
  eraseJiraPersonalData,
  assignWorkspace,
  updateJiraAccountId,
  connectJira,
  disconnectJira,
  isJiraConnected,
  formatPublicProfile,
  findByUsername,
  updateProfile,
  updatePassword,
  strip,
}
