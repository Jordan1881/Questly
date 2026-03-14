exports.up = async (knex) => {
  await knex.schema.createTable('task_assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
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
    // completedAt is null until this specific developer marks their assignment done
    table.timestamp('completed_at').nullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())

    // Each developer is assigned to a task exactly once
    table.unique(['task_id', 'user_id'])
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('task_assignments')
}
