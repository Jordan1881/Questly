const db = require('../config/db')
const { ensureMembershipRow } = require('../lib/backfillWorkspaceMemberships')

const TABLE = 'workspace_memberships'

async function findByUserAndWorkspace(user_id, workspace_id) {
  return db(TABLE).where({ user_id, workspace_id }).first()
}

async function listActiveByUser(user_id) {
  return db(TABLE).where({ user_id, status: 'active' }).orderBy('last_used_at', 'desc')
}

/**
 * Dual-write helper: ensure an active membership exists without changing
 * legacy users.workspace_id / workspaces.admin_id authority while the flag is off.
 */
async function ensureMembership({
  user_id,
  workspace_id,
  role,
  current_sprint_xp = 0,
  lifetime_xp = 0,
  coin_balance = 0,
  copyProgress = false,
}, trx = db) {
  await ensureMembershipRow(trx, { user_id, workspace_id, role, status: 'active' })

  if (copyProgress) {
    await trx(TABLE)
      .where({ user_id, workspace_id })
      .update({
        current_sprint_xp,
        lifetime_xp,
        coin_balance,
        last_used_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
  } else {
    await trx(TABLE)
      .where({ user_id, workspace_id })
      .update({
        last_used_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
  }

  return trx(TABLE).where({ user_id, workspace_id }).first()
}

async function ensureMembershipFromUser(user, { workspace_id, role, copyProgress = false }, trx = db) {
  return ensureMembership({
    user_id: user.id,
    workspace_id,
    role,
    current_sprint_xp: user.current_sprint_xp || 0,
    lifetime_xp: user.lifetime_xp || 0,
    coin_balance: user.coin_balance || 0,
    copyProgress,
  }, trx)
}

module.exports = {
  findByUserAndWorkspace,
  listActiveByUser,
  ensureMembership,
  ensureMembershipFromUser,
}
