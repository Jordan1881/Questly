exports.up = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.text('jira_refresh_token').nullable()
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('jira_refresh_token')
  })
}
