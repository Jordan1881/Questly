/**
 * Allow Google-only users (no local password) and store Cognito subject.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.string('password_hash').nullable().alter()
    table.string('cognito_sub').nullable().unique()
  })
}

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  // Google-only users would block NOT NULL; fill a placeholder before restore.
  await knex('users').whereNull('password_hash').update({
    password_hash: '!cognito-only-no-local-password',
  })

  await knex.schema.alterTable('users', (table) => {
    table.dropUnique(['cognito_sub'])
    table.dropColumn('cognito_sub')
    table.string('password_hash').notNullable().alter()
  })
}
