const WorkspaceModel = require('../models/workspace')

function canAccessWorkspace(user, workspace) {
  return workspace.admin_id === user.id || user.workspace_id === workspace.id
}

async function create(req, res, next) {
  try {
    const { name } = req.body
    if (!name) {
      return res.status(400).json({ error: 'name is required' })
    }

    const workspace = await WorkspaceModel.create({ name, admin_id: req.user.id })
    res.status(201).json({ workspace })
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

module.exports = { create, getById }
