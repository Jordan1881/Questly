const WorkspaceMembershipModel = require('../models/workspaceMembership')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')

/**
 * Resolves the active workspace for scoped routes.
 * Flag off: uses users.workspace_id (legacy).
 * Flag on: requires X-Workspace-Id for an active membership; updates last_used_at.
 */
async function requireWorkspaceContext(req, res, next) {
  try {
    if (!isMultiWorkspaceEnabled()) {
      req.workspaceId = req.user.workspace_id || null
      req.membership = null
      return next()
    }

    const header = (req.get('X-Workspace-Id') || '').trim()
    if (!header) {
      return res.status(403).json({ error: 'X-Workspace-Id header is required' })
    }

    const membership = await WorkspaceMembershipModel.findByUserAndWorkspace(
      req.user.id,
      header
    )
    if (!membership || membership.status !== 'active') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await WorkspaceMembershipModel.touchLastUsed(membership.id)

    req.workspaceId = membership.workspace_id
    req.membership = membership
    // Overlay so existing controllers that read req.user.workspace_id stay correct.
    req.user = { ...req.user, workspace_id: membership.workspace_id }

    return next()
  } catch (err) {
    return next(err)
  }
}

module.exports = requireWorkspaceContext
