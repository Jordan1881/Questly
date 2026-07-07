exports.up = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.integer('age').nullable()
    table.jsonb('preferences').notNullable().defaultTo('{}')
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('age')
    table.dropColumn('preferences')
  })
}
