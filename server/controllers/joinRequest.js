const JoinRequestModel = require('../models/joinRequest')
const WorkspaceModel = require('../models/workspace')
const UserModel = require('../models/user')
const { ensureDeveloperJiraAccountId } = require('../services/jiraAssignee')
const { buildWorkspaceJiraOverrides } = require('../services/jiraSync')
const WorkspaceMembershipModel = require('../models/workspaceMembership')
const { jiraSiteHostname } = require('../lib/jiraSiteContext')
const { userCanAdminWorkspace } = require('../lib/workspaceAuth')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')
const { parsePagination, setTotalCount } = require('../lib/pagination')

async function submit(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const multiWorkspace = isMultiWorkspaceEnabled()

    if (multiWorkspace) {
      const activeMembership = await WorkspaceMembershipModel.findByUserAndWorkspace(
        req.user.id,
        workspace.id
      )
      if (activeMembership?.status === 'active') {
        return res.status(400).json({ error: 'You already belong to this workspace' })
      }

      const pendingAnywhere = await JoinRequestModel.findPendingByUser(req.user.id)
      if (pendingAnywhere) {
        return res.status(409).json({
          error: 'You already have a pending join request',
        })
      }
    } else if (req.user.workspace_id) {
      return res.status(400).json({ error: 'You already belong to a workspace' })
    } else {
      const existing = await JoinRequestModel.findPendingByUserAndWorkspace(
        req.user.id,
        workspace.id
      )
      if (existing) {
        return res.status(409).json({ error: 'Join request already pending' })
      }
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

    if (!(await userCanAdminWorkspace(req.user, workspace))) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const pagination = parsePagination(req.query)
    if (pagination.active) {
      const total = await JoinRequestModel.countPendingByWorkspace(workspace.id)
      const join_requests = await JoinRequestModel.listPendingByWorkspace(workspace.id, {
        limit: pagination.limit,
        offset: pagination.offset,
      })
      setTotalCount(res, total)
      return res.json({ join_requests })
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

    if (!(await userCanAdminWorkspace(req.user, workspace))) {
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
      const developer = await UserModel.findByIdInternal(joinRequest.user_id)
      const priorMembership = await WorkspaceMembershipModel.findByUserAndWorkspace(
        joinRequest.user_id,
        workspace.id
      )
      const existingMemberships = isMultiWorkspaceEnabled()
        ? await WorkspaceMembershipModel.listActiveByUser(joinRequest.user_id)
        : []
      // Never overwrite retained balances when reactivating an inactive membership.
      const copyProgress =
        !priorMembership && (!isMultiWorkspaceEnabled() || existingMemberships.length === 0)

      // Legacy primary: always set when flag off. When flag on, only set when unset
      // so create-first users keep their created workspace (not the later join).
      if (!isMultiWorkspaceEnabled() || !developer.workspace_id) {
        await UserModel.assignWorkspace(joinRequest.user_id, workspace.id)
      }

      await WorkspaceMembershipModel.ensureMembershipFromUser(developer, {
        workspace_id: workspace.id,
        role: priorMembership?.role === 'admin' ? 'admin' : 'developer',
        copyProgress,
      })
      const jiraOverrides = await buildWorkspaceJiraOverrides(workspace)
      await ensureDeveloperJiraAccountId(
        await UserModel.findByIdInternal(joinRequest.user_id),
        jiraOverrides
      )
    }

    const payload = { join_request: updated }
    if (status === 'approved') {
      payload.workspace = WorkspaceModel.sanitize(workspace)
      if (isMultiWorkspaceEnabled()) {
        const membership = await WorkspaceMembershipModel.findByUserAndWorkspace(
          joinRequest.user_id,
          workspace.id
        )
        payload.membership = WorkspaceMembershipModel.toPublicMembership(membership, workspace)
      }
    }

    res.json(payload)
  } catch (err) {
    next(err)
  }
}

async function getMine(req, res, next) {
  try {
    const join_request = await JoinRequestModel.findPendingByUser(req.user.id)
    if (!join_request) {
      return res.json({ join_request: null })
    }

    const workspace = await WorkspaceModel.findById(join_request.workspace_id)

    res.json({
      join_request: {
        ...join_request,
        team_jira_site_host: jiraSiteHostname(workspace?.jira_site_url),
        team_jira_connected: WorkspaceModel.isJiraConnected(workspace),
      },
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { submit, listPending, review, getMine }
