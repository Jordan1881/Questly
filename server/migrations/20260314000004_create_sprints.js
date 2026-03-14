exports.up = async (knex) => {
  await knex.schema.createTable('sprints', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('workspace_id')
      .notNullable()
      .references('id')
      .inTable('workspaces')
      .onDelete('CASCADE')
    table.string('name').notNullable()
    table.date('start_date').nullable()
    table.date('end_date').nullable()
    table
      .enu('status', ['planned', 'active', 'completed'])
      .notNullable()
      .defaultTo('planned')
    table
      .uuid('created_by')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
    table.timestamp('closed_at').nullable()
    table.timestamps(true, true)
  })

  // Core business rule: only one active sprint per workspace at any time
  // DB-level guarantee — no code path can bypass this
  await knex.raw(
    `CREATE UNIQUE INDEX sprints_workspace_active_idx ON sprints(workspace_id) WHERE status = 'active'`
  )
}

exports.down = async (knex) => {
  await knex.raw('DROP INDEX IF EXISTS sprints_workspace_active_idx')
  await knex.schema.dropTable('sprints')
}
