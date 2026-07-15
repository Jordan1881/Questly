const db = require('../config/db')
const WorkspaceModel = require('../models/workspace')
const SprintModel = require('../models/sprint')
const UserModel = require('../models/user')
const WorkspaceMembershipModel = require('../models/workspaceMembership')
const { canAccessWorkspace, isWorkspaceAdmin } = require('../lib/workspaceAuth')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')

function mapDateField(value, fieldName) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  return value
}

function isUniqueViolation(err) {
  return err.code === '23505' || /sprints_workspace_active_idx/.test(err.message || '')
}

async function createForWorkspace(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { name, startDate, endDate } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' })
    }

    try {
      const sprint = await SprintModel.create({
        workspace_id: workspace.id,
        name: String(name).trim(),
        start_date: mapDateField(startDate, 'startDate'),
        end_date: mapDateField(endDate, 'endDate'),
        created_by: req.user.id,
        status: 'active',
      })

      return res.status(201).json({ sprint: SprintModel.formatSprint(sprint) })
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: 'Workspace already has an active sprint' })
      }
      throw err
    }
  } catch (err) {
    next(err)
  }
}

async function listForWorkspace(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!canAccessWorkspace(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const rows = await SprintModel.listByWorkspace(workspace.id)
    res.json({ sprints: rows.map(SprintModel.formatSprint) })
  } catch (err) {
    next(err)
  }
}

async function getActiveForWorkspace(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!canAccessWorkspace(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const sprint = await SprintModel.findActiveByWorkspace(workspace.id)
    res.json({ sprint: SprintModel.formatSprint(sprint) })
  } catch (err) {
    next(err)
  }
}

async function updateSprint(req, res, next) {
  try {
    const sprint = await SprintModel.findById(req.params.id)
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' })
    }

    const workspace = await WorkspaceModel.findById(sprint.workspace_id)
    if (!workspace || !isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const patch = {}
    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      if (!req.body.name || !String(req.body.name).trim()) {
        return res.status(400).json({ error: 'name cannot be empty' })
      }
      patch.name = String(req.body.name).trim()
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'startDate')) {
      patch.start_date = mapDateField(req.body.startDate, 'startDate')
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'endDate')) {
      patch.end_date = mapDateField(req.body.endDate, 'endDate')
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({
        error: `At least one of ${SprintModel.PATCHABLE_FIELDS.join(', ')} is required`,
      })
    }

    const updated = await SprintModel.update(sprint.id, patch)
    res.json({ sprint: SprintModel.formatSprint(updated) })
  } catch (err) {
    next(err)
  }
}

async function closeSprint(req, res, next) {
  try {
    const sprint = await SprintModel.findById(req.params.id)
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' })
    }

    if (sprint.status === 'completed') {
      return res.status(409).json({ error: 'Sprint is already completed' })
    }

    const workspace = await WorkspaceModel.findById(sprint.workspace_id)
    if (!workspace || !isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await db.transaction(async (trx) => {
      if (isMultiWorkspaceEnabled()) {
        const members = await WorkspaceMembershipModel.resetSprintXpForWorkspace(
          workspace.id,
          trx
        )
        for (const member of members) {
          await trx('xp_transactions').insert({
            user_id: member.user_id,
            sprint_id: sprint.id,
            amount: -member.current_sprint_xp,
            reason: 'sprint_reset',
          })
        }
      } else {
        const members = await UserModel.listDevelopersByWorkspace(workspace.id)

        for (const member of members) {
          const xpAmount = member.current_sprint_xp ?? 0
          if (xpAmount === 0) continue

          await trx('users')
            .where({ id: member.id })
            .update({ current_sprint_xp: 0 })

          await trx('xp_transactions').insert({
            user_id: member.id,
            sprint_id: sprint.id,
            amount: -xpAmount,
            reason: 'sprint_reset',
          })
        }
      }

      await trx(SprintModel.TABLE)
        .where({ id: sprint.id })
        .update({
          status: 'completed',
          closed_at: trx.fn.now(),
        })
    })

    const closed = await SprintModel.findById(sprint.id)
    res.json({ sprint: SprintModel.formatSprint(closed) })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createForWorkspace,
  listForWorkspace,
  getActiveForWorkspace,
  updateSprint,
  closeSprint,
}
