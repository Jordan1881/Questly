exports.up = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.integer('coin_balance').notNullable().defaultTo(0)
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('coin_balance')
  })
}
