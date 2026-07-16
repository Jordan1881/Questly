/**
 * Phase 2: developer personal Jira OAuth pending session (user-scoped).
 * Also stores the confirmed personal site URL for team-site mismatch checks.
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('user_jira_oauth_pending', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('user_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    table.text('access_token').notNullable()
    table.text('refresh_token').nullable()
    table.timestamp('expires_at', { useTz: true }).notNullable()
    table.string('selected_site_url', 512).nullable()
    table.string('selected_cloud_id', 64).nullable()
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.alterTable('users', (table) => {
    table.string('jira_site_url', 512).nullable()
  })
}

exports.down = async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('jira_site_url')
  })
  await knex.schema.dropTableIfExists('user_jira_oauth_pending')
}
