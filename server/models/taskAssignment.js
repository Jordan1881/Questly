const db = require('../config/db')

const TABLE = 'task_assignments'

async function ensure(task_id, user_id) {
  const existing = await db(TABLE).where({ task_id, user_id }).first()
  if (existing) return existing

  const [assignment] = await db(TABLE).insert({ task_id, user_id }).returning('*')
  return assignment
}

async function listForUser(user_id, workspace_id = null) {
  let query = db(`${TABLE} as ta`)
    .join('tasks as t', 't.id', 'ta.task_id')
    .where('ta.user_id', user_id)

  if (workspace_id) {
    query = query.where('t.workspace_id', workspace_id)
  }

  return query
    .leftJoin('xp_approval_requests as xr', function joinPendingApprovals() {
      this.on('xr.task_id', 't.id')
        .andOn('xr.user_id', 'ta.user_id')
        .andOnVal('xr.status', 'pending')
    })
    .select(
      't.id',
      't.workspace_id',
      't.jira_issue_id',
      't.jira_issue_key',
      't.title',
      't.description',
      't.difficulty',
      't.xp_reward',
      't.due_date',
      't.high_priority',
      't.status',
      'ta.completed_at',
      'xr.id as pending_approval_id',
      'xr.xp_amount as pending_xp_amount',
    )
    .orderBy('t.updated_at', 'desc')
}

async function findForUser(task_id, user_id) {
  return db(TABLE).where({ task_id, user_id }).first()
}

async function setCompleted(task_id, user_id, completed, trx = db) {
  const patch = { completed_at: completed ? trx.fn.now() : null }
  const [assignment] = await trx(TABLE).where({ task_id, user_id }).update(patch).returning('*')
  return assignment ?? null
}

// Atomically transition an assignment to completed only if it is not already
// completed. Returns the updated row when THIS call performed the transition,
// or null when the assignment was already completed (e.g. a concurrent
// duplicate request won the race). Prevents double-awarding XP/coins.
async function markCompleted(task_id, user_id, trx = db) {
  const [assignment] = await trx(TABLE)
    .where({ task_id, user_id })
    .whereNull('completed_at')
    .update({ completed_at: trx.fn.now() })
    .returning('*')
  return assignment ?? null
}

async function listByTask(task_id) {
  return db(TABLE).where({ task_id })
}

async function removeUncompleted(task_id, user_id) {
  return db(TABLE)
    .where({ task_id, user_id })
    .whereNull('completed_at')
    .del()
}

module.exports = {
  ensure,
  listForUser,
  listByTask,
  findForUser,
  setCompleted,
  markCompleted,
  removeUncompleted,
}
