const db = require('../config/db')

const TABLE = 'tasks'

async function upsertByJiraIssue({ workspace_id, jira_issue_id, ...fields }) {
  const existing = await db(TABLE).where({ jira_issue_id }).first()

  if (existing) {
    const [task] = await db(TABLE).where({ id: existing.id }).update(fields).returning('*')
    return { task, created: false }
  }

  const [task] = await db(TABLE)
    .insert({ workspace_id, jira_issue_id, ...fields })
    .returning('*')
  return { task, created: true }
}

async function findById(id) {
  return db(TABLE).where({ id }).first()
}

async function listByWorkspace(workspace_id, filters = {}) {
  let query = db(TABLE).where({ workspace_id })

  if (filters.status) {
    query = query.where({ status: filters.status })
  }
  if (filters.difficulty) {
    query = query.where({ difficulty: filters.difficulty })
  }
  if (filters.assignee) {
    query = query.whereIn('id', function assigneeSubquery() {
      this.select('task_id').from('task_assignments').where({ user_id: filters.assignee })
    })
  }

  return query.orderBy('updated_at', 'desc')
}

module.exports = {
  upsertByJiraIssue,
  findById,
  listByWorkspace,
}
