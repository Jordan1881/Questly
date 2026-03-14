exports.up = async (knex) => {
  await knex.schema.createTable('join_requests', (table) => {
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
    table
      .enu('status', ['pending', 'approved', 'rejected'])
      .notNullable()
      .defaultTo('pending')
    table.uuid('reviewed_by').nullable().references('id').inTable('users').onDelete('SET NULL')
    table.timestamp('reviewed_at').nullable()
    table.timestamps(true, true)
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('join_requests')
}
