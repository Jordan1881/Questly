const db = require('../config/db')
const WorkspaceModel = require('../models/workspace')
const TaskAssignmentModel = require('../models/taskAssignment')
const TaskModel = require('../models/task')
const XpApprovalRequestModel = require('../models/xpApprovalRequest')
const jiraSync = require('../services/jiraSync')
const taskRewards = require('../services/taskRewards')
const { applyStreakUpdate } = require('../services/streak')
const WorkspaceMembershipModel = require('../models/workspaceMembership')
const { canAccessWorkspace, userCanAdminWorkspace } = require('../lib/workspaceAuth')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')

function formatDueDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTask(row) {
  const xpPending = Boolean(row.pending_approval_id)
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
    xpPending,
    xpPendingAmount: xpPending ? row.pending_xp_amount : null,
    status: row.status,
  }
}

async function listByWorkspace(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!(await userCanAdminWorkspace(req.user, workspace))) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const filters = {}
    if (req.query.status) filters.status = req.query.status
    if (req.query.difficulty) filters.difficulty = req.query.difficulty
    if (req.query.assignee) filters.assignee = req.query.assignee

    const rows = await TaskModel.listByWorkspace(workspace.id, filters)
    res.json({ tasks: rows.map((row) => formatTask(row)) })
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const task = await TaskModel.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const workspace = await WorkspaceModel.findById(task.workspace_id)
    const membership = isMultiWorkspaceEnabled()
      ? await WorkspaceMembershipModel.findByUserAndWorkspace(req.user.id, task.workspace_id)
      : req.membership
    if (!workspace || !canAccessWorkspace(req.user, workspace, membership)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const assignment = await TaskAssignmentModel.findForUser(task.id, req.user.id)
    const row = {
      ...task,
      completed_at: assignment?.completed_at ?? null,
    }

    res.json({
      task: {
        ...formatTask(row),
        completedAt: assignment?.completed_at ?? null,
      },
    })
  } catch (err) {
    next(err)
  }
}

async function listMine(req, res, next) {
  try {
    const workspaceId = req.workspaceId ?? req.user.workspace_id
    if (!workspaceId) {
      return res.status(404).json({ error: 'You are not in a workspace yet' })
    }

    const rows = await TaskAssignmentModel.listForUser(req.user.id, workspaceId)
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

    if (!(await userCanAdminWorkspace(req.user, workspace))) {
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

    const workspaceId = req.workspaceId ?? req.user.workspace_id
    if (task.workspace_id !== workspaceId) {
      return res.status(403).json({
        error: 'This task belongs to another workspace. Ask your admin to sync tasks again.',
      })
    }

    const assignment = await TaskAssignmentModel.findForUser(task.id, req.user.id)
    if (!assignment) {
      return res.status(403).json({ error: 'You are not assigned to this task' })
    }

    const wasCompleted = Boolean(assignment.completed_at)
    const pendingApproval = await XpApprovalRequestModel.findPendingByTaskAndUser(
      task.id,
      req.user.id,
    )

    if (completed && wasCompleted) {
      return res.status(409).json({ error: 'Task is already completed' })
    }

    const workspace = await WorkspaceModel.findById(task.workspace_id)
    const requiresApproval = Boolean(workspace?.require_xp_approval)

    const result = await db.transaction(async (trx) => {
      if (completed && !wasCompleted && requiresApproval) {
        const updated = await TaskAssignmentModel.setCompleted(task.id, req.user.id, true, trx)
        await XpApprovalRequestModel.createPending(
          {
            workspace_id: task.workspace_id,
            task_id: task.id,
            user_id: req.user.id,
            xp_amount: task.xp_reward ?? 0,
          },
          trx,
        )

        const balances = await taskRewards.getUserBalances(req.user.id, trx, workspaceId)
        const profile = await trx('users')
          .where({ id: req.user.id })
          .select('streak_days')
          .first()

        return {
          updated,
          reward: {
            xpDelta: 0,
            coinsDelta: 0,
            pending: true,
            pendingXp: task.xp_reward ?? 0,
          },
          pendingApproval: {
            id: null,
            xp_amount: task.xp_reward ?? 0,
          },
          user: {
            ...balances,
            streak_days: profile?.streak_days ?? 0,
          },
        }
      }

      if (!completed && wasCompleted && pendingApproval) {
        await XpApprovalRequestModel.cancelPending(task.id, req.user.id, trx)
        const updated = await TaskAssignmentModel.setCompleted(task.id, req.user.id, false, trx)
        const balances = await taskRewards.getUserBalances(req.user.id, trx, workspaceId)
        const profile = await trx('users')
          .where({ id: req.user.id })
          .select('streak_days')
          .first()

        return {
          updated,
          reward: { xpDelta: 0, coinsDelta: 0, pendingCancelled: true },
          user: {
            ...balances,
            streak_days: profile?.streak_days ?? 0,
          },
        }
      }

      const updated = await TaskAssignmentModel.setCompleted(task.id, req.user.id, completed, trx)
      const reward = await taskRewards.applyCompletionChange(trx, {
        userId: req.user.id,
        task,
        wasCompleted,
        willComplete: completed,
        workspaceId,
      })

      if (completed && !wasCompleted) {
        await applyStreakUpdate(trx, req.user.id)
      }

      const balances = await taskRewards.getUserBalances(req.user.id, trx, workspaceId)
      const profile = await trx('users')
        .where({ id: req.user.id })
        .select('streak_days')
        .first()

      return {
        updated,
        reward,
        user: {
          ...balances,
          streak_days: profile?.streak_days ?? 0,
        },
      }
    })

    const pendingAfter = completed && requiresApproval && !wasCompleted
      ? await XpApprovalRequestModel.findPendingByTaskAndUser(task.id, req.user.id)
      : null

    const row = {
      ...task,
      completed_at: result.updated.completed_at,
      pending_approval_id: pendingAfter?.id ?? null,
      pending_xp_amount: pendingAfter?.xp_amount ?? null,
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
  listByWorkspace,
  getById,
  listMine,
  sync,
  updateCompletion,
  formatTask,
}
