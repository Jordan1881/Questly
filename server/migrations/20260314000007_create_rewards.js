exports.up = async (knex) => {
  await knex.schema.createTable('rewards', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('workspace_id')
      .notNullable()
      .references('id')
      .inTable('workspaces')
      .onDelete('CASCADE')
    table.string('title').notNullable()
    table.text('description').nullable()
    table.integer('xp_cost').notNullable()
    table.string('image_url').nullable()
    // Set to false automatically when all coupons are redeemed
    table.boolean('is_available').notNullable().defaultTo(true)
    table
      .uuid('created_by')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
    table.timestamps(true, true)
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('rewards')
}
