/**
 * Expand-phase backfill: seed workspace_memberships from legacy
 * workspaces.admin_id + users.workspace_id, copying user-level progress
 * onto each user's primary membership only (avoids doubling balances).
 */

async function ensureMembershipRow(knex, { user_id, workspace_id, role, status = 'active' }) {
  const existing = await knex('workspace_memberships')
    .where({ user_id, workspace_id })
    .first()

  if (existing) {
    const nextRole = existing.role === 'admin' || role === 'admin' ? 'admin' : 'developer'
    if (nextRole !== existing.role || existing.status !== status) {
      await knex('workspace_memberships').where({ id: existing.id }).update({
        role: nextRole,
        status,
        updated_at: knex.fn.now(),
      })
    }
    return existing.id
  }

  const [row] = await knex('workspace_memberships')
    .insert({
      user_id,
      workspace_id,
      role,
      status,
      current_sprint_xp: 0,
      lifetime_xp: 0,
      coin_balance: 0,
    })
    .returning(['id'])

  return row.id
}

async function backfillWorkspaceMemberships(knex) {
  const workspaces = await knex('workspaces').select('id', 'admin_id')
  for (const workspace of workspaces) {
    if (!workspace.admin_id) continue
    await ensureMembershipRow(knex, {
      user_id: workspace.admin_id,
      workspace_id: workspace.id,
      role: 'admin',
    })
  }

  const members = await knex('users')
    .whereNotNull('workspace_id')
    .select('id', 'workspace_id')

  for (const user of members) {
    const ownsWorkspace = workspaces.some(
      (workspace) => workspace.id === user.workspace_id && workspace.admin_id === user.id
    )
    await ensureMembershipRow(knex, {
      user_id: user.id,
      workspace_id: user.workspace_id,
      role: ownsWorkspace ? 'admin' : 'developer',
    })
  }

  const users = await knex('users').select(
    'id',
    'workspace_id',
    'current_sprint_xp',
    'lifetime_xp',
    'coin_balance'
  )

  for (const user of users) {
    let membership = null
    if (user.workspace_id) {
      membership = await knex('workspace_memberships')
        .where({ user_id: user.id, workspace_id: user.workspace_id })
        .first()
    }
    if (!membership) {
      membership = await knex('workspace_memberships')
        .where({ user_id: user.id, role: 'admin', status: 'active' })
        .orderBy('created_at', 'asc')
        .first()
    }
    if (!membership) continue

    await knex('workspace_memberships')
      .where({ id: membership.id })
      .update({
        current_sprint_xp: user.current_sprint_xp || 0,
        lifetime_xp: user.lifetime_xp || 0,
        coin_balance: user.coin_balance || 0,
        last_used_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
  }
}

module.exports = {
  backfillWorkspaceMemberships,
  ensureMembershipRow,
}
