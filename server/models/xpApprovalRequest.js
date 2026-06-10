const db = require('../config/db')

const TABLE = 'xp_approval_requests'

async function createPending({ workspace_id, task_id, user_id, xp_amount }, trx = db) {
  const [request] = await trx(TABLE)
    .insert({
      workspace_id,
      task_id,
      user_id,
      xp_amount,
      status: 'pending',
    })
    .returning('*')
  return request
}

async function findPendingByTaskAndUser(task_id, user_id, trx = db) {
  return trx(TABLE).where({ task_id, user_id, status: 'pending' }).first()
}

async function findById(id) {
  return db(TABLE).where({ id }).first()
}

async function cancelPending(task_id, user_id, trx = db) {
  return trx(TABLE).where({ task_id, user_id, status: 'pending' }).del()
}

async function listPendingByWorkspace(workspace_id) {
  return db(`${TABLE} as xr`)
    .join('users as u', 'xr.user_id', 'u.id')
    .join('tasks as t', 'xr.task_id', 't.id')
    .where({ 'xr.workspace_id': workspace_id, 'xr.status': 'pending' })
    .select(
      'xr.id',
      'xr.workspace_id',
      'xr.task_id',
      'xr.user_id',
      'xr.xp_amount',
      'xr.status',
      'xr.created_at',
      'u.username',
      'u.email',
      't.title as task_title',
      't.jira_issue_key',
      't.difficulty',
    )
    .orderBy('xr.created_at', 'asc')
}

async function updateStatus(id, { status, reviewed_by }, trx = db) {
  const [request] = await trx(TABLE)
    .where({ id, status: 'pending' })
    .update({
      status,
      reviewed_by,
      reviewed_at: trx.fn.now(),
    })
    .returning('*')
  return request ?? null
}

module.exports = {
  createPending,
  findPendingByTaskAndUser,
  findById,
  cancelPending,
  listPendingByWorkspace,
  updateStatus,
}
