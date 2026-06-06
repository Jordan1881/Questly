exports.up = async (knex) => {
  await knex.schema.alterTable('tasks', (table) => {
    table.dropUnique(['jira_issue_id'])
  })

  await knex.raw(`
    CREATE UNIQUE INDEX tasks_workspace_jira_issue_id_unique
    ON tasks (workspace_id, jira_issue_id)
    WHERE jira_issue_id IS NOT NULL
  `)
}

exports.down = async (knex) => {
  await knex.raw('DROP INDEX IF EXISTS tasks_workspace_jira_issue_id_unique')

  await knex.schema.alterTable('tasks', (table) => {
    table.unique(['jira_issue_id'])
  })
}
