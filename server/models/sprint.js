const db = require('../config/db')

const TABLE = 'sprints'
const PATCHABLE_FIELDS = ['name', 'start_date', 'end_date']

function formatDate(value) {
  if (!value) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function daysRemaining(endDate) {
  if (!endDate) return null

  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const diffMs = end.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diffMs / 86_400_000))
}

function formatSprint(row) {
  if (!row) return null

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    startDate: formatDate(row.start_date),
    endDate: formatDate(row.end_date),
    status: row.status,
    closedAt: row.closed_at,
    daysRemaining: daysRemaining(row.end_date),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function create({ workspace_id, name, start_date = null, end_date = null, created_by, status = 'active' }) {
  const [sprint] = await db(TABLE)
    .insert({
      workspace_id,
      name,
      start_date,
      end_date,
      created_by,
      status,
    })
    .returning('*')
  return sprint
}

async function findById(id) {
  return db(TABLE).where({ id }).first()
}

async function findActiveByWorkspace(workspace_id) {
  return db(TABLE).where({ workspace_id, status: 'active' }).first()
}

async function listByWorkspace(workspace_id, { limit, offset } = {}) {
  let query = db(TABLE)
    .where({ workspace_id })
    .orderBy('start_date', 'desc')
    .orderBy('created_at', 'desc')

  if (limit != null) {
    query = query.limit(limit).offset(offset || 0)
  }

  return query
}

async function countByWorkspace(workspace_id) {
  const row = await db(TABLE).where({ workspace_id }).count({ count: '*' }).first()
  return Number(row?.count ?? 0)
}

async function update(id, fields) {
  const patch = {}
  for (const key of PATCHABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      patch[key] = fields[key]
    }
  }

  if (Object.keys(patch).length === 0) {
    return null
  }

  const [sprint] = await db(TABLE).where({ id }).update(patch).returning('*')
  return sprint ?? undefined
}

async function close(id) {
  const [sprint] = await db(TABLE)
    .where({ id })
    .update({
      status: 'completed',
      closed_at: db.fn.now(),
    })
    .returning('*')
  return sprint ?? undefined
}

module.exports = {
  TABLE,
  PATCHABLE_FIELDS,
  daysRemaining,
  formatSprint,
  create,
  findById,
  findActiveByWorkspace,
  listByWorkspace,
  countByWorkspace,
  update,
  close,
}
