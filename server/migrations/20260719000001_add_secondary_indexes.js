// Secondary indexes for the hottest read paths. These columns are filtered on
// every list/lookup but were previously only covered by composite/unique
// constraints (or not at all), forcing sequential scans as row counts grow.
// IF NOT EXISTS keeps the migration idempotent across environments.
exports.up = async (knex) => {
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS tasks_workspace_id_idx ON tasks (workspace_id)',
  )
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS task_assignments_user_id_idx ON task_assignments (user_id)',
  )
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS xp_transactions_user_id_idx ON xp_transactions (user_id)',
  )
}

exports.down = async (knex) => {
  await knex.raw('DROP INDEX IF EXISTS tasks_workspace_id_idx')
  await knex.raw('DROP INDEX IF EXISTS task_assignments_user_id_idx')
  await knex.raw('DROP INDEX IF EXISTS xp_transactions_user_id_idx')
}
