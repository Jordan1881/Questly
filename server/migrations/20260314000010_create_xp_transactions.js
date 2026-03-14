exports.up = async (knex) => {
  await knex.schema.createTable('xp_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    // Nullable: sprint_reset transactions are written as sprint closes
    table.uuid('sprint_id').nullable().references('id').inTable('sprints').onDelete('SET NULL')
    // Positive = earned, negative = spent/reset
    table.integer('amount').notNullable()
    table
      .enu('reason', ['task_completed', 'reward_purchased', 'sprint_reset'])
      .notNullable()
    table.uuid('task_id').nullable().references('id').inTable('tasks').onDelete('SET NULL')
    table.uuid('purchase_id').nullable().references('id').inTable('purchases').onDelete('SET NULL')
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('xp_transactions')
}
