const db = require('../config/db')

const TABLE = 'task_assignments'

async function ensure(task_id, user_id) {
  const existing = await db(TABLE).where({ task_id, user_id }).first()
  if (existing) return existing

  const [assignment] = await db(TABLE).insert({ task_id, user_id }).returning('*')
  return assignment
}

async function listForUser(user_id) {
  return db(`${TABLE} as ta`)
    .join('tasks as t', 't.id', 'ta.task_id')
    .where('ta.user_id', user_id)
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

module.exports = {
  ensure,
  listForUser,
  findForUser,
  setCompleted,
}
