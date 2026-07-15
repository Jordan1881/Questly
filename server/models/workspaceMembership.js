const db = require('../config/db')
const WorkspaceModel = require('./workspace')
const { ensureMembershipRow } = require('../lib/backfillWorkspaceMemberships')
const { jiraSiteHostname } = require('../lib/jiraSiteContext')

const TABLE = 'workspace_memberships'

async function findByUserAndWorkspace(user_id, workspace_id) {
  return db(TABLE).where({ user_id, workspace_id }).first()
}

async function listActiveByUser(user_id) {
  return db(TABLE)
    .where({ user_id, status: 'active' })
    .orderByRaw('last_used_at DESC NULLS LAST')
    .orderBy('created_at', 'asc')
}

function toPublicMembership(membership, workspace) {
  const siteUrl = workspace?.jira_site_url || null
  return {
    id: membership.id,
    workspace_id: membership.workspace_id,
    role: membership.role,
    status: membership.status,
    is_owner: Boolean(workspace && workspace.admin_id === membership.user_id),
    current_sprint_xp: membership.current_sprint_xp,
    lifetime_xp: membership.lifetime_xp,
    coin_balance: membership.coin_balance,
    last_used_at: membership.last_used_at,
    workspace: workspace
      ? {
          id: workspace.id,
          name: workspace.name,
          code: workspace.code,
          jira_project_key: workspace.jira_project_key || null,
          team_jira_site_host: jiraSiteHostname(siteUrl),
          team_jira_connected: WorkspaceModel.isJiraConnected(workspace),
        }
      : null,
  }
}

async function listActivePublicByUser(user_id) {
  const rows = await listActiveByUser(user_id)
  const result = []
  for (const membership of rows) {
    const workspace = await WorkspaceModel.findById(membership.workspace_id)
    result.push(toPublicMembership(membership, workspace))
  }
  return result
}

function pickActiveMembership(memberships, user, preferredWorkspaceId = null) {
  if (!memberships.length) return null
  if (preferredWorkspaceId) {
    const preferred = memberships.find((m) => m.workspace_id === preferredWorkspaceId)
    if (preferred) return preferred
  }
  if (user?.workspace_id) {
    const byWorkspace = memberships.find((m) => m.workspace_id === user.workspace_id)
    if (byWorkspace) return byWorkspace
  }
  return memberships[0]
}

/**
 * @param {object} user
 * @param {{ preferredWorkspaceId?: string|null }} [options]
 *   When preferredWorkspaceId matches an active membership, it wins over
 *   users.workspace_id / last_used ordering (used by GET /me + X-Workspace-Id).
 */
async function buildMembershipContext(user, { preferredWorkspaceId = null } = {}) {
  const memberships = await listActivePublicByUser(user.id)
  const active = pickActiveMembership(memberships, user, preferredWorkspaceId)
  return {
    memberships,
    active_workspace_id: active?.workspace_id ?? null,
    active_membership: active
      ? {
          workspace_id: active.workspace_id,
          role: active.role,
          is_owner: active.is_owner,
        }
      : null,
  }
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

async function touchLastUsed(membershipId, trx = db) {
  await trx(TABLE).where({ id: membershipId }).update({
    last_used_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  })
}

async function listActiveMembersWithProgress(workspace_id) {
  return db(`${TABLE} as m`)
    .join('users as u', 'm.user_id', 'u.id')
    .where({ 'm.workspace_id': workspace_id, 'm.status': 'active' })
    .select(
      'u.id',
      'u.email',
      'u.username',
      'u.avatar_url',
      'u.role',
      'm.workspace_id',
      'm.role as membership_role',
      'm.current_sprint_xp',
      'm.lifetime_xp',
      'm.coin_balance',
      'm.last_used_at'
    )
    .orderBy('u.username', 'asc')
}

async function resetSprintXpForWorkspace(workspace_id, trx = db) {
  const members = await trx(TABLE)
    .where({ workspace_id, status: 'active' })
    .where('current_sprint_xp', '>', 0)
    .select('id', 'user_id', 'current_sprint_xp')

  for (const member of members) {
    await trx(TABLE).where({ id: member.id }).update({ current_sprint_xp: 0 })
  }

  return members
}

async function setRole(user_id, workspace_id, role, trx = db) {
  const [row] = await trx(TABLE)
    .where({ user_id, workspace_id, status: 'active' })
    .update({ role, updated_at: trx.fn.now() })
    .returning('*')
  return row || null
}

async function deactivate(user_id, workspace_id, trx = db) {
  const [row] = await trx(TABLE)
    .where({ user_id, workspace_id })
    .update({ status: 'inactive', updated_at: trx.fn.now() })
    .returning('*')
  return row || null
}

module.exports = {
  findByUserAndWorkspace,
  listActiveByUser,
  listActivePublicByUser,
  pickActiveMembership,
  buildMembershipContext,
  toPublicMembership,
  ensureMembership,
  ensureMembershipFromUser,
  touchLastUsed,
  listActiveMembersWithProgress,
  resetSprintXpForWorkspace,
  setRole,
  deactivate,
}
