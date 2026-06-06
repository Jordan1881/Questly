exports.up = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.timestamp('jira_personal_data_updated_at', { useTz: true }).nullable()
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('jira_personal_data_updated_at')
  })
}
