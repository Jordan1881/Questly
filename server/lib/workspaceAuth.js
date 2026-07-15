/**
 * Workspace authorization helpers.
 * Flag off: owner via workspaces.admin_id; members via users.workspace_id.
 * Flag on: also honor active membership role when provided.
 */

const { isMultiWorkspaceEnabled } = require('./featureFlags')
const WorkspaceMembershipModel = require('../models/workspaceMembership')

function isWorkspaceOwner(user, workspace) {
  if (!user || !workspace) return false
  return workspace.admin_id === user.id
}

function isWorkspaceAdmin(user, workspace, membership = null) {
  if (!user || !workspace) return false
  if (isWorkspaceOwner(user, workspace)) return true
  if (
    isMultiWorkspaceEnabled() &&
    membership &&
    membership.workspace_id === workspace.id &&
    membership.status === 'active' &&
    membership.role === 'admin'
  ) {
    return true
  }
  return false
}

function canAccessWorkspace(user, workspace, membership = null) {
  if (!user || !workspace) return false
  if (isWorkspaceAdmin(user, workspace, membership)) return true
  if (isMultiWorkspaceEnabled()) {
    // Flag on: active membership only — do not fall back to users.workspace_id
    // (inactive members may still have a stale primary workspace_id).
    return Boolean(
      membership &&
        membership.workspace_id === workspace.id &&
        membership.status === 'active'
    )
  }
  return user.workspace_id === workspace.id
}

async function getActiveMembership(userId, workspaceId) {
  if (!isMultiWorkspaceEnabled() || !userId || !workspaceId) return null
  const membership = await WorkspaceMembershipModel.findByUserAndWorkspace(userId, workspaceId)
  if (!membership || membership.status !== 'active') return null
  return membership
}

async function userCanAdminWorkspace(user, workspace) {
  if (!user || !workspace) return false
  const membership = await getActiveMembership(user.id, workspace.id)
  return isWorkspaceAdmin(user, workspace, membership)
}

async function userCanAccessWorkspace(user, workspace) {
  if (!user || !workspace) return false
  const membership = await getActiveMembership(user.id, workspace.id)
  return canAccessWorkspace(user, workspace, membership)
}

module.exports = {
  isWorkspaceOwner,
  isWorkspaceAdmin,
  canAccessWorkspace,
  getActiveMembership,
  userCanAdminWorkspace,
  userCanAccessWorkspace,
}
