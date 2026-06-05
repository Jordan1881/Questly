const crypto = require('crypto')

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode(length = 8) {
  let code = ''
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i] % CHARSET.length]
  }
  return code
}

exports.up = async (knex) => {
  await knex.schema.alterTable('workspaces', (table) => {
    table.string('code', 12).nullable().unique()
  })

  const workspaces = await knex('workspaces').select('id')
  const used = new Set()

  for (const workspace of workspaces) {
    let code
    do {
      code = randomCode()
    } while (used.has(code) || (await knex('workspaces').where({ code }).first()))
    used.add(code)
    await knex('workspaces').where({ id: workspace.id }).update({ code })
  }

  await knex.schema.alterTable('workspaces', (table) => {
    table.string('code', 12).notNullable().alter()
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('workspaces', (table) => {
    table.dropColumn('code')
  })
}
