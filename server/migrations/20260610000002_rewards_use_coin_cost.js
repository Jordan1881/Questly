exports.up = async (knex) => {
  await knex.schema.alterTable('rewards', (table) => {
    table.integer('coin_cost').nullable()
  })

  await knex.raw(`
    UPDATE rewards
    SET coin_cost = GREATEST(1, FLOOR(xp_cost / 10.0))
  `)

  await knex.schema.alterTable('rewards', (table) => {
    table.dropColumn('xp_cost')
    table.integer('coin_cost').notNullable().alter()
  })

  await knex.schema.alterTable('purchases', (table) => {
    table.integer('coins_spent').nullable()
  })

  await knex.raw(`
    UPDATE purchases
    SET coins_spent = GREATEST(1, FLOOR(xp_spent / 10.0))
  `)

  await knex.schema.alterTable('purchases', (table) => {
    table.dropColumn('xp_spent')
    table.integer('coins_spent').notNullable().alter()
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('rewards', (table) => {
    table.integer('xp_cost').nullable()
  })

  await knex.raw(`
    UPDATE rewards
    SET xp_cost = coin_cost * 10
  `)

  await knex.schema.alterTable('rewards', (table) => {
    table.dropColumn('coin_cost')
    table.integer('xp_cost').notNullable().alter()
  })

  await knex.schema.alterTable('purchases', (table) => {
    table.integer('xp_spent').nullable()
  })

  await knex.raw(`
    UPDATE purchases
    SET xp_spent = coins_spent * 10
  `)

  await knex.schema.alterTable('purchases', (table) => {
    table.dropColumn('coins_spent')
    table.integer('xp_spent').notNullable().alter()
  })
}
