const crypto = require('crypto')
const db = require('../config/db')

const TABLE = 'workspaces'
const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PATCHABLE_FIELDS = ['name', 'jira_project_key', 'jira_site_url']

function randomCode(length = 8) {
  let code = ''
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    code += CODE_CHARSET[bytes[i] % CODE_CHARSET.length]
  }
  return code
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode()
    const existing = await db(TABLE).where({ code }).first()
    if (!existing) return code
  }
  throw new Error('Failed to generate unique workspace code')
}

async function create({ name, admin_id }) {
  const code = await generateUniqueCode()
  const [workspace] = await db(TABLE).insert({ name, admin_id, code }).returning('*')
  return workspace
}

async function findById(id) {
  return db(TABLE).where({ id }).first()
}

async function findByCode(code) {
  return db(TABLE).where({ code }).first()
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

  const [workspace] = await db(TABLE).where({ id }).update(patch).returning('*')
  return workspace ?? undefined
}

function sanitize(workspace) {
  if (!workspace) return null
  const { jira_access_token, ...safe } = workspace
  return safe
}

module.exports = {
  create,
  findById,
  findByCode,
  update,
  sanitize,
  PATCHABLE_FIELDS,
}
