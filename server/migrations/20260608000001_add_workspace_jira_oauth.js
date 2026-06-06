exports.up = async (knex) => {
  await knex.schema.alterTable('workspaces', (table) => {
    table.text('jira_refresh_token').nullable()
    table.string('jira_cloud_id', 64).nullable()
    table.string('jira_auth_type', 16).notNullable().defaultTo('api_token')
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('workspaces', (table) => {
    table.dropColumn('jira_refresh_token')
    table.dropColumn('jira_cloud_id')
    table.dropColumn('jira_auth_type')
  })
}
