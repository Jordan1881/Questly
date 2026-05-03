const WorkspaceModel = require('../models/workspace')

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

module.exports = { create }
