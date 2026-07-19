const db = require('../config/db')

const TABLE = 'tasks'

async function upsertByJiraIssue({ workspace_id, jira_issue_id, ...fields }) {
  const existing = await db(TABLE).where({ workspace_id, jira_issue_id }).first()

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

// App-driven local status change (task completion toggles). Kept separate from
// upsertByJiraIssue so a later Jira sync can still reconcile status without this
// helper fighting it; per-user completion is preserved via task_assignments.
async function setStatus(id, status, trx = db) {
  const [task] = await trx(TABLE).where({ id }).update({ status }).returning('*')
  return task ?? null
}

async function pruneStaleJiraTasks(workspace_id, activeJiraIssueIds = []) {
  if (!workspace_id) return 0

  let query = db(TABLE).where({ workspace_id }).whereNotNull('jira_issue_id')

  if (activeJiraIssueIds.length > 0) {
    query = query.whereNotIn('jira_issue_id', activeJiraIssueIds)
  }

  return query.del()
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
  setStatus,
  listByWorkspace,
  pruneStaleJiraTasks,
}
