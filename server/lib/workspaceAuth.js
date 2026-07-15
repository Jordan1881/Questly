/**
 * Workspace authorization helpers.
 * Today: owner via workspaces.admin_id; members via users.workspace_id.
 * Later memberships will plug in here without scattering checks across controllers.
 */

function isWorkspaceAdmin(user, workspace) {
  if (!user || !workspace) return false
  return workspace.admin_id === user.id
}

function canAccessWorkspace(user, workspace) {
  if (!user || !workspace) return false
  return isWorkspaceAdmin(user, workspace) || user.workspace_id === workspace.id
}

module.exports = {
  isWorkspaceAdmin,
  canAccessWorkspace,
}
