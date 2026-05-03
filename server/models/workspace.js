const db = require('../config/db')

const TABLE = 'workspaces'

async function create({ name, admin_id }) {
  const [workspace] = await db(TABLE).insert({ name, admin_id }).returning('*')
  return workspace
}

async function findById(id) {
  return db(TABLE).where({ id }).first()
}

module.exports = { create, findById }
