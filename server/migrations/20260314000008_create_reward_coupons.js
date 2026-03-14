exports.up = async (knex) => {
  await knex.schema.createTable('reward_coupons', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('reward_id')
      .notNullable()
      .references('id')
      .inTable('rewards')
      .onDelete('CASCADE')
    table.string('coupon_code').notNullable()
    table.boolean('is_redeemed').notNullable().defaultTo(false)
    // Default: 1 year from creation — enforced at application layer when inserting
    table.timestamp('expires_at').notNullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('reward_coupons')
}
