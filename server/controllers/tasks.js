const db = require('../config/db')
const WorkspaceModel = require('../models/workspace')
const TaskAssignmentModel = require('../models/taskAssignment')
const TaskModel = require('../models/task')
const jiraSync = require('../services/jiraSync')
const taskRewards = require('../services/taskRewards')

function formatDueDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTask(row) {
  const done = Boolean(row.completed_at) || row.status === 'done'

  return {
    id: row.id,
    jiraId: row.jira_issue_key,
    title: row.title,
    desc: row.description || '',
    difficulty: (row.difficulty || 'medium').toUpperCase(),
    xp: row.xp_reward ?? 0,
    due: formatDueDate(row.due_date) || 'No due date',
    highPriority: row.high_priority,
    done,
    status: row.status,
  }
}

async function listMine(req, res, next) {
  try {
    if (!req.user.workspace_id) {
      return res.status(404).json({ error: 'You are not in a workspace yet' })
    }

    const rows = await TaskAssignmentModel.listForUser(req.user.id)
    res.json({ tasks: rows.map(formatTask) })
  } catch (err) {
    next(err)
  }
}

async function sync(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.workspaceId)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.admin_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const result = await jiraSync.syncWorkspaceTasks(workspace)
    res.json(result)
  } catch (err) {
    if (err.status === 503) {
      return res.status(503).json({ error: err.message })
    }
    next(err)
  }
}

async function updateCompletion(req, res, next) {
  try {
    const { completed } = req.body
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be a boolean' })
    }

    const task = await TaskModel.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    if (task.workspace_id !== req.user.workspace_id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const assignment = await TaskAssignmentModel.findForUser(task.id, req.user.id)
    if (!assignment) {
      return res.status(404).json({ error: 'Task assignment not found' })
    }

    const wasCompleted = Boolean(assignment.completed_at)

    const result = await db.transaction(async (trx) => {
      const updated = await TaskAssignmentModel.setCompleted(task.id, req.user.id, completed, trx)
      const reward = await taskRewards.applyCompletionChange(trx, {
        userId: req.user.id,
        task,
        wasCompleted,
        willComplete: completed,
      })
      const user = await taskRewards.getUserBalances(req.user.id, trx)

      return { updated, reward, user }
    })

    const row = {
      ...task,
      completed_at: result.updated.completed_at,
    }

    res.json({
      task: formatTask(row),
      reward: result.reward,
      user: result.user,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listMine,
  sync,
  updateCompletion,
  formatTask,
}
