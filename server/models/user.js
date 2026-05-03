const db = require('../config/db')

const TABLE = 'users'

function strip(user) {
  if (!user) return null
  const { password_hash, ...safe } = user
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

module.exports = { findByEmail, findById, create }
