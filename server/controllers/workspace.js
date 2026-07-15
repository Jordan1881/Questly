const WorkspaceModel = require('../models/workspace')
const UserModel = require('../models/user')
const WorkspaceMembershipModel = require('../models/workspaceMembership')
const jiraClient = require('../services/jiraClient')
const { publicWorkspaceLookup } = require('../lib/jiraSiteContext')
const { canAccessWorkspace, isWorkspaceAdmin } = require('../lib/workspaceAuth')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')

async function create(req, res, next) {
  try {
    const { name } = req.body
    if (!name) {
      return res.status(400).json({ error: 'name is required' })
    }

    const workspace = await WorkspaceModel.create({ name, admin_id: req.user.id })
    const owner = await UserModel.findByIdInternal(req.user.id)
    const existingMemberships = isMultiWorkspaceEnabled()
      ? await WorkspaceMembershipModel.listActiveByUser(req.user.id)
      : []
    const copyProgress = !isMultiWorkspaceEnabled()
      ? !owner?.workspace_id
      : existingMemberships.length === 0

    await WorkspaceMembershipModel.ensureMembershipFromUser(owner, {
      workspace_id: workspace.id,
      role: 'admin',
      copyProgress,
    })

    // Dual-path: keep users.role aligned so remaining requireRole('admin') routes work
    // until membership-based auth lands in later tickets.
    if (isMultiWorkspaceEnabled() && owner?.role !== 'admin') {
      await UserModel.updateRole(req.user.id, 'admin')
    }

    const payload = { workspace: WorkspaceModel.sanitize(workspace) }
    if (isMultiWorkspaceEnabled()) {
      payload.memberships = await WorkspaceMembershipModel.listActivePublicByUser(req.user.id)
      payload.active_workspace_id = workspace.id
      payload.active_membership = {
        workspace_id: workspace.id,
        role: 'admin',
        is_owner: true,
      }
    }

    res.status(201).json(payload)
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!canAccessWorkspace(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    res.json({ workspace: WorkspaceModel.sanitize(workspace) })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const hasPatchableField = WorkspaceModel.PATCHABLE_FIELDS.some((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field)
    )
    if (!hasPatchableField) {
      return res.status(400).json({
        error: `At least one of ${WorkspaceModel.PATCHABLE_FIELDS.join(', ')} is required`,
      })
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'name') && !req.body.name) {
      return res.status(400).json({ error: 'name cannot be empty' })
    }

    if (
      Object.prototype.hasOwnProperty.call(req.body, 'require_xp_approval') &&
      typeof req.body.require_xp_approval !== 'boolean'
    ) {
      return res.status(400).json({ error: 'require_xp_approval must be a boolean' })
    }

    const updated = await WorkspaceModel.update(req.params.id, req.body)
    if (!updated) {
      return res.status(400).json({
        error: `At least one of ${WorkspaceModel.PATCHABLE_FIELDS.join(', ')} is required`,
      })
    }

    res.json({ workspace: WorkspaceModel.sanitize(updated) })
  } catch (err) {
    next(err)
  }
}

async function getByCode(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findByCode(req.params.code.toUpperCase())
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    res.json({ workspace: publicWorkspaceLookup(workspace) })
  } catch (err) {
    next(err)
  }
}

async function getMine(req, res, next) {
  try {
    if (isMultiWorkspaceEnabled()) {
      const context = await WorkspaceMembershipModel.buildMembershipContext(req.user)
      if (!context.memberships.length) {
        return res.status(404).json({ error: 'Workspace not found' })
      }

      const workspace = await WorkspaceModel.findById(context.active_workspace_id)
      return res.json({
        workspace: WorkspaceModel.sanitize(workspace),
        ...context,
      })
    }

    const workspace = await WorkspaceModel.findByAdminId(req.user.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    res.json({ workspace: WorkspaceModel.sanitize(workspace) })
  } catch (err) {
    next(err)
  }
}

async function listMembers(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const members = await UserModel.listByWorkspace(workspace.id)
    res.json({ members })
  } catch (err) {
    next(err)
  }
}

async function connectJira(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { jira_site_url, jira_project_key } = req.body
    const accessToken = req.body.access_token || req.body.jira_access_token

    if (!jira_site_url || !jira_project_key || !accessToken) {
      return res.status(400).json({
        error: 'jira_site_url, jira_project_key, and access_token are required',
      })
    }

    try {
      await jiraClient.validateCredentials({
        siteUrl: jira_site_url,
        email: req.user.email,
        apiToken: accessToken,
        projectKey: jira_project_key,
      })
    } catch (err) {
      const status = err.status && err.status >= 400 && err.status < 500 ? 400 : 502
      return res.status(status).json({ error: err.message || 'Invalid Jira credentials' })
    }

    const updated = await WorkspaceModel.connectJira(workspace.id, {
      jira_site_url,
      jira_project_key,
      jira_access_token: accessToken,
    })

    res.json({ workspace: WorkspaceModel.sanitize(updated) })
  } catch (err) {
    next(err)
  }
}

async function disconnectJira(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const updated = await WorkspaceModel.disconnectJira(workspace.id)
    res.json({ workspace: WorkspaceModel.sanitize(updated) })
  } catch (err) {
    next(err)
  }
}

async function listMemberships(req, res, next) {
  try {
    if (!isMultiWorkspaceEnabled()) {
      return res.status(404).json({ error: 'Not found' })
    }

    res.json(await WorkspaceMembershipModel.buildMembershipContext(req.user))
  } catch (err) {
    next(err)
  }
}

module.exports = {
  create,
  getById,
  update,
  getByCode,
  getMine,
  listMembers,
  listMemberships,
  connectJira,
  disconnectJira,
}
