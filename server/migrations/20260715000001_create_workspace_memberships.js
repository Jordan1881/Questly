const { backfillWorkspaceMemberships } = require('../lib/backfillWorkspaceMemberships')

exports.up = async (knex) => {
  await knex.schema.createTable('workspace_memberships', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    table
      .uuid('workspace_id')
      .notNullable()
      .references('id')
      .inTable('workspaces')
      .onDelete('CASCADE')
    table.enu('role', ['admin', 'developer']).notNullable()
    table.enu('status', ['active', 'inactive']).notNullable().defaultTo('active')
    table.integer('current_sprint_xp').notNullable().defaultTo(0)
    table.integer('lifetime_xp').notNullable().defaultTo(0)
    table.integer('coin_balance').notNullable().defaultTo(0)
    table.timestamp('last_used_at', { useTz: true }).nullable()
    table.timestamps(true, true)
    table.unique(['user_id', 'workspace_id'])
  })

  await knex.raw(`
    CREATE INDEX workspace_memberships_user_status_idx
    ON workspace_memberships (user_id, status)
  `)
  await knex.raw(`
    CREATE INDEX workspace_memberships_workspace_status_idx
    ON workspace_memberships (workspace_id, status)
  `)

  await backfillWorkspaceMemberships(knex)
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('workspace_memberships')
}
