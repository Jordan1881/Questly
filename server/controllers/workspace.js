const WorkspaceModel = require('../models/workspace')
const UserModel = require('../models/user')
const jiraClient = require('../services/jiraClient')

function canAccessWorkspace(user, workspace) {
  return workspace.admin_id === user.id || user.workspace_id === workspace.id
}

function isWorkspaceAdmin(user, workspace) {
  return workspace.admin_id === user.id
}

async function create(req, res, next) {
  try {
    const { name } = req.body
    if (!name) {
      return res.status(400).json({ error: 'name is required' })
    }

    const workspace = await WorkspaceModel.create({ name, admin_id: req.user.id })
    res.status(201).json({ workspace: WorkspaceModel.sanitize(workspace) })
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

    res.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        code: workspace.code,
      },
    })
  } catch (err) {
    next(err)
  }
}

async function getMine(req, res, next) {
  try {
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

module.exports = {
  create,
  getById,
  update,
  getByCode,
  getMine,
  listMembers,
  connectJira,
  disconnectJira,
}
