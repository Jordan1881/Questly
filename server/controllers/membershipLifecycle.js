const db = require('../config/db')
const WorkspaceModel = require('../models/workspace')
const WorkspaceMembershipModel = require('../models/workspaceMembership')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')
const { isWorkspaceOwner } = require('../lib/workspaceAuth')

function requireMultiWorkspaceFlag(res) {
  if (!isMultiWorkspaceEnabled()) {
    res.status(404).json({ error: 'Not found' })
    return false
  }
  return true
}

async function updateMemberRole(req, res, next) {
  try {
    if (!requireMultiWorkspaceFlag(res)) return

    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })

    if (!isWorkspaceOwner(req.user, workspace)) {
      return res.status(403).json({ error: 'Only the workspace owner can change member roles' })
    }

    const { role } = req.body
    if (!['admin', 'developer'].includes(role)) {
      return res.status(400).json({ error: 'role must be admin or developer' })
    }

    const targetUserId = req.params.userId
    if (targetUserId === workspace.admin_id) {
      return res.status(400).json({ error: 'Cannot change the workspace owner role here — transfer ownership first' })
    }

    const membership = await WorkspaceMembershipModel.findByUserAndWorkspace(
      targetUserId,
      workspace.id
    )
    if (!membership || membership.status !== 'active') {
      return res.status(404).json({ error: 'Active membership not found' })
    }

    const updated = await WorkspaceMembershipModel.setRole(targetUserId, workspace.id, role)
    res.json({
      membership: WorkspaceMembershipModel.toPublicMembership(updated, workspace),
    })
  } catch (err) {
    next(err)
  }
}

async function transferOwnership(req, res, next) {
  try {
    if (!requireMultiWorkspaceFlag(res)) return

    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })

    if (!isWorkspaceOwner(req.user, workspace)) {
      return res.status(403).json({ error: 'Only the workspace owner can transfer ownership' })
    }

    const targetUserId = req.body.userId || req.body.user_id
    if (!targetUserId) {
      return res.status(400).json({ error: 'userId is required' })
    }
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'You already own this workspace' })
    }

    const targetMembership = await WorkspaceMembershipModel.findByUserAndWorkspace(
      targetUserId,
      workspace.id
    )
    if (!targetMembership || targetMembership.status !== 'active' || targetMembership.role !== 'admin') {
      return res.status(400).json({ error: 'Transfer target must be an existing active admin' })
    }

    const updatedWorkspace = await db.transaction(async (trx) => {
      await WorkspaceMembershipModel.setRole(targetUserId, workspace.id, 'admin', trx)
      await WorkspaceMembershipModel.setRole(req.user.id, workspace.id, 'admin', trx)

      const [row] = await trx('workspaces')
        .where({ id: workspace.id })
        .update({ admin_id: targetUserId, updated_at: trx.fn.now() })
        .returning('*')

      return row
    })

    res.json({
      workspace: WorkspaceModel.sanitize(updatedWorkspace),
      previous_owner_id: req.user.id,
      new_owner_id: targetUserId,
    })
  } catch (err) {
    next(err)
  }
}

async function leaveWorkspace(req, res, next) {
  try {
    if (!requireMultiWorkspaceFlag(res)) return

    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })

    if (isWorkspaceOwner(req.user, workspace)) {
      return res.status(400).json({
        error: 'Transfer ownership to another admin before leaving this workspace',
      })
    }

    const membership = await WorkspaceMembershipModel.findByUserAndWorkspace(
      req.user.id,
      workspace.id
    )
    if (!membership || membership.status !== 'active') {
      return res.status(404).json({ error: 'Active membership not found' })
    }

    const deactivated = await db.transaction(async (trx) => {
      const row = await WorkspaceMembershipModel.deactivate(req.user.id, workspace.id, trx)
      if (req.user.workspace_id === workspace.id) {
        await trx('users').where({ id: req.user.id }).update({ workspace_id: null })
      }
      return row
    })

    res.json({
      membership: WorkspaceMembershipModel.toPublicMembership(deactivated, workspace),
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  updateMemberRole,
  transferOwnership,
  leaveWorkspace,
}
