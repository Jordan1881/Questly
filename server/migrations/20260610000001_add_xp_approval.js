exports.up = async (knex) => {
  await knex.schema.alterTable('workspaces', (table) => {
    table.boolean('require_xp_approval').notNullable().defaultTo(false)
  })

  await knex.schema.createTable('xp_approval_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('workspace_id')
      .notNullable()
      .references('id')
      .inTable('workspaces')
      .onDelete('CASCADE')
    table
      .uuid('task_id')
      .notNullable()
      .references('id')
      .inTable('tasks')
      .onDelete('CASCADE')
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    table.integer('xp_amount').notNullable()
    table.enu('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending')
    table.uuid('reviewed_by').nullable().references('id').inTable('users').onDelete('SET NULL')
    table.timestamp('reviewed_at').nullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })

  await knex.raw(`
    CREATE UNIQUE INDEX xp_approval_requests_one_pending_per_assignment
    ON xp_approval_requests (task_id, user_id)
    WHERE status = 'pending'
  `)
}

exports.down = async (knex) => {
  await knex.raw('DROP INDEX IF EXISTS xp_approval_requests_one_pending_per_assignment')
  await knex.schema.dropTableIfExists('xp_approval_requests')
  await knex.schema.alterTable('workspaces', (table) => {
    table.dropColumn('require_xp_approval')
  })
}
