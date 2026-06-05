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
]

function strip(user) {
  if (!user) return null
  const { password_hash, jira_access_token, jira_account_id, ...safe } = user
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
  strip,
}
