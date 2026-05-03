exports.up = async (knex) => {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('email').notNullable().unique()
    table.string('password_hash').notNullable()
    table.string('username').notNullable()
    table.string('avatar_url').nullable()
    table.enu('role', ['admin', 'developer']).notNullable().defaultTo('developer')
    table
      .uuid('workspace_id')
      .nullable()
      .references('id')
      .inTable('workspaces')
      .onDelete('SET NULL')
    table.string('jira_account_id').nullable()
    table.text('jira_access_token').nullable()
    table.integer('current_sprint_xp').notNullable().defaultTo(0)
    table.integer('lifetime_xp').notNullable().defaultTo(0)
    table.integer('streak_days').notNullable().defaultTo(0)
    table.date('last_activity_date').nullable()
    table.timestamps(true, true)
  })

  // Resolve circular FK: workspaces.admin_id → users
  await knex.schema.alterTable('workspaces', (table) => {
    table.foreign('admin_id').references('id').inTable('users').onDelete('SET NULL')
  })
}

exports.down = async (knex) => {
  // Drop circular FK before dropping users
  await knex.schema.alterTable('workspaces', (table) => {
    table.dropForeign(['admin_id'])
  })
  await knex.schema.dropTable('users')
}
