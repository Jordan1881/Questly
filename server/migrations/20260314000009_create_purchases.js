exports.up = async (knex) => {
  await knex.schema.createTable('purchases', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    table
      .uuid('reward_id')
      .notNullable()
      .references('id')
      .inTable('rewards')
      .onDelete('RESTRICT')
    table
      .uuid('coupon_id')
      .nullable()
      .references('id')
      .inTable('reward_coupons')
      .onDelete('SET NULL')
    table.integer('xp_spent').notNullable()
    table.timestamp('purchased_at').notNullable().defaultTo(knex.fn.now())
    // Soft delete: set deleted_at when developer removes from My Rewards
    // Record preserved for audit trail
    table.timestamp('deleted_at').nullable()
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('purchases')
}
