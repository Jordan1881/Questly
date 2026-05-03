exports.up = async (knex) => {
  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('workspace_id')
      .notNullable()
      .references('id')
      .inTable('workspaces')
      .onDelete('CASCADE')
    table.uuid('sprint_id').nullable().references('id').inTable('sprints').onDelete('SET NULL')
    // jira_issue_id is the unique key for upsert during Jira sync
    table.string('jira_issue_id').nullable().unique()
    table.string('jira_issue_key').nullable()
    table.string('title').notNullable()
    table.text('description').nullable()
    table.enu('difficulty', ['easy', 'medium', 'hard']).nullable()
    table.integer('xp_reward').nullable()
    table.date('due_date').nullable()
    table.boolean('high_priority').notNullable().defaultTo(false)
    table.string('status').notNullable().defaultTo('to_do')
    table.timestamps(true, true)
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('tasks')
}
