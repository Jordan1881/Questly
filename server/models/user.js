const db = require('../config/db')

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
]

function strip(user) {
  if (!user) return null
  const { password_hash, jira_access_token, jira_refresh_token, jira_account_id, ...safe } = user
  return safe
}

async function findByEmail(email) {
  return db(TABLE).where({ email }).first()
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
  return db(TABLE).where({ workspace_id, role: 'developer' })
}

async function findByJiraAccountId(jira_account_id, workspace_id) {
  return db(TABLE).where({ jira_account_id, workspace_id }).first()
}

async function findByIdInternal(id) {
  return db(TABLE).where({ id }).first()
}

async function assignWorkspace(user_id, workspace_id) {
  const [user] = await db(TABLE).where({ id: user_id }).update({ workspace_id }).returning('*')
  return strip(user)
}

async function updateJiraAccountId(user_id, jira_account_id) {
  const [user] = await db(TABLE).where({ id: user_id }).update({ jira_account_id }).returning('*')
  return strip(user)
}

async function connectJira(
  user_id,
  { jira_access_token, jira_account_id, jira_refresh_token = undefined },
) {
  const patch = { jira_access_token, jira_account_id }
  if (jira_refresh_token !== undefined) {
    patch.jira_refresh_token = jira_refresh_token
  }

  const [user] = await db(TABLE).where({ id: user_id }).update(patch).returning('*')
  return strip(user)
}

async function disconnectJira(user_id) {
  const [user] = await db(TABLE)
    .where({ id: user_id })
    .update({ jira_access_token: null, jira_refresh_token: null, jira_account_id: null })
    .returning('*')
  return strip(user)
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
  }
}

async function findByUsername(username, excludeUserId = null) {
  let query = db(TABLE).where({ username })
  if (excludeUserId) query = query.whereNot({ id: excludeUserId })
  return query.first()
}

async function updateProfile(user_id, { username, avatarUrl, avatar_url }) {
  const patch = {}
  const nextUsername = username
  const nextAvatar = avatarUrl ?? avatar_url

  if (nextUsername !== undefined) patch.username = nextUsername
  if (nextAvatar !== undefined) patch.avatar_url = nextAvatar

  if (!Object.keys(patch).length) {
    return findByIdInternal(user_id)
  }

  const [user] = await db(TABLE).where({ id: user_id }).update(patch).returning('*')
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
  assignWorkspace,
  updateJiraAccountId,
  connectJira,
  disconnectJira,
  isJiraConnected,
  formatPublicProfile,
  findByUsername,
  updateProfile,
  strip,
}
