const JoinRequestModel = require('../models/joinRequest')
const WorkspaceModel = require('../models/workspace')
const UserModel = require('../models/user')

function isWorkspaceAdmin(user, workspace) {
  return workspace.admin_id === user.id
}

async function submit(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (req.user.workspace_id) {
      return res.status(400).json({ error: 'You already belong to a workspace' })
    }

    const existing = await JoinRequestModel.findPendingByUserAndWorkspace(
      req.user.id,
      workspace.id
    )
    if (existing) {
      return res.status(409).json({ error: 'Join request already pending' })
    }

    const joinRequest = await JoinRequestModel.create({
      user_id: req.user.id,
      workspace_id: workspace.id,
    })

    res.status(201).json({ join_request: joinRequest })
  } catch (err) {
    next(err)
  }
}

async function listPending(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const join_requests = await JoinRequestModel.listPendingByWorkspace(workspace.id)
    res.json({ join_requests })
  } catch (err) {
    next(err)
  }
}

async function review(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { status } = req.body
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or rejected' })
    }

    const joinRequest = await JoinRequestModel.findById(req.params.requestId)
    if (!joinRequest || joinRequest.workspace_id !== workspace.id) {
      return res.status(404).json({ error: 'Join request not found' })
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Join request is no longer pending' })
    }

    const updated = await JoinRequestModel.updateStatus(joinRequest.id, {
      status,
      reviewed_by: req.user.id,
    })

    if (status === 'approved') {
      await UserModel.assignWorkspace(joinRequest.user_id, workspace.id)
    }

    res.json({ join_request: updated })
  } catch (err) {
    next(err)
  }
}

async function getMine(req, res, next) {
  try {
    const join_request = await JoinRequestModel.findPendingByUser(req.user.id)
    res.json({ join_request: join_request ?? null })
  } catch (err) {
    next(err)
  }
}

module.exports = { submit, listPending, review, getMine }
