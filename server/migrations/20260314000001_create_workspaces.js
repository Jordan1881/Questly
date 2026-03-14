exports.up = async (knex) => {
  // Enable pgcrypto for gen_random_uuid() — used by all tables
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

  await knex.schema.createTable('workspaces', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('name').notNullable()
    // admin_id FK added in migration 002 after users table exists (circular dependency)
    table.uuid('admin_id').nullable()
    table.string('jira_project_key').nullable()
    table.text('jira_access_token').nullable()
    table.string('jira_site_url').nullable()
    table.timestamps(true, true) // created_at + updated_at with defaults
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('workspaces')
}
