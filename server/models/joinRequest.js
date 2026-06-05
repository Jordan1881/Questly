const db = require('../config/db')

const TABLE = 'join_requests'

async function create({ user_id, workspace_id }) {
  const [joinRequest] = await db(TABLE).insert({ user_id, workspace_id }).returning('*')
  return joinRequest
}

async function findById(id) {
  return db(TABLE).where({ id }).first()
}

async function findPendingByUser(user_id) {
  return db(TABLE).where({ user_id, status: 'pending' }).first()
}

async function findPendingByUserAndWorkspace(user_id, workspace_id) {
  return db(TABLE).where({ user_id, workspace_id, status: 'pending' }).first()
}

async function listPendingByWorkspace(workspace_id) {
  return db(`${TABLE} as jr`)
    .join('users as u', 'jr.user_id', 'u.id')
    .where({ 'jr.workspace_id': workspace_id, 'jr.status': 'pending' })
    .select(
      'jr.id',
      'jr.user_id',
      'jr.workspace_id',
      'jr.status',
      'jr.created_at',
      'u.username',
      'u.email'
    )
    .orderBy('jr.created_at', 'asc')
}

async function updateStatus(id, { status, reviewed_by }) {
  const [joinRequest] = await db(TABLE)
    .where({ id })
    .update({
      status,
      reviewed_by,
      reviewed_at: db.fn.now(),
    })
    .returning('*')
  return joinRequest
}

module.exports = {
  create,
  findById,
  findPendingByUser,
  findPendingByUserAndWorkspace,
  listPendingByWorkspace,
  updateStatus,
}
