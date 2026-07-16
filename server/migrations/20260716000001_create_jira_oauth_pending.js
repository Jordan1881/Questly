/**
 * Short-lived pending Atlassian OAuth sessions for workspace Jira connect
 * (authorize first, then confirm site/project).
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('jira_oauth_pending', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    table
      .uuid('workspace_id')
      .notNullable()
      .references('id')
      .inTable('workspaces')
      .onDelete('CASCADE')
    table.text('access_token').notNullable()
    table.text('refresh_token').nullable()
    table.timestamp('expires_at', { useTz: true }).notNullable()
    table.text('selected_site_url').nullable()
    table.text('selected_cloud_id').nullable()
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.unique(['user_id', 'workspace_id'])
    table.index(['expires_at'])
  })
}

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('jira_oauth_pending')
}
