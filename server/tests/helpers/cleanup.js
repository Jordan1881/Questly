async function cleanupCoreTables(db) {
  await db('xp_transactions').del()
  await db('purchases').del()
  await db('reward_coupons').del()
  await db('rewards').del()
  await db('task_assignments').del()
  await db('tasks').del()
  await db('join_requests').del()
  await db('sprints').del()
  if (await db.schema.hasTable('workspace_memberships')) {
    await db('workspace_memberships').del()
  }
  await db('users').del()
  await db('workspaces').del()
}

module.exports = { cleanupCoreTables }
