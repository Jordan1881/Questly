/**
 * Workspace authorization helpers.
 * Flag off: owner via workspaces.admin_id; members via users.workspace_id.
 * Flag on: also honor active membership role when provided.
 */

const { isMultiWorkspaceEnabled } = require('./featureFlags')

function isWorkspaceAdmin(user, workspace, membership = null) {
  if (!user || !workspace) return false
  if (workspace.admin_id === user.id) return true
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
  if (
    isMultiWorkspaceEnabled() &&
    membership &&
    membership.workspace_id === workspace.id &&
    membership.status === 'active'
  ) {
    return true
  }
  return user.workspace_id === workspace.id
}

module.exports = {
  isWorkspaceAdmin,
  canAccessWorkspace,
}
