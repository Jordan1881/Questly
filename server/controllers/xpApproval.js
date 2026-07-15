const db = require('../config/db')
const WorkspaceModel = require('../models/workspace')
const TaskModel = require('../models/task')
const TaskAssignmentModel = require('../models/taskAssignment')
const XpApprovalRequestModel = require('../models/xpApprovalRequest')
const taskRewards = require('../services/taskRewards')
const { applyStreakUpdate } = require('../services/streak')
const { formatTask } = require('./tasks')
const { userCanAdminWorkspace } = require('../lib/workspaceAuth')

async function listPending(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!(await userCanAdminWorkspace(req.user, workspace))) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const xp_approval_requests = await XpApprovalRequestModel.listPendingByWorkspace(workspace.id)
    res.json({ xp_approval_requests })
  } catch (err) {
    next(err)
  }
}

async function review(req, res, next) {
  try {
    const { status } = req.body
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or rejected' })
    }

    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!(await userCanAdminWorkspace(req.user, workspace))) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const approvalRequest = await XpApprovalRequestModel.findById(req.params.requestId)
    if (!approvalRequest || approvalRequest.workspace_id !== workspace.id) {
      return res.status(404).json({ error: 'XP approval request not found' })
    }

    if (approvalRequest.status !== 'pending') {
      return res.status(400).json({ error: 'XP approval request is no longer pending' })
    }

    const task = await TaskModel.findById(approvalRequest.task_id)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const result = await db.transaction(async (trx) => {
      const updatedRequest = await XpApprovalRequestModel.updateStatus(
        approvalRequest.id,
        { status, reviewed_by: req.user.id },
        trx,
      )

      if (!updatedRequest) {
        const err = new Error('XP approval request is no longer pending')
        err.status = 400
        throw err
      }

      if (status === 'rejected') {
        await TaskAssignmentModel.setCompleted(task.id, approvalRequest.user_id, false, trx)
        const balances = await taskRewards.getUserBalances(
          approvalRequest.user_id,
          trx,
          task.workspace_id
        )
        return { xp_approval_request: updatedRequest, reward: null, user: balances }
      }

      const reward = await taskRewards.applyCompletionChange(trx, {
        userId: approvalRequest.user_id,
        task,
        wasCompleted: false,
        willComplete: true,
        workspaceId: task.workspace_id,
      })

      await applyStreakUpdate(trx, approvalRequest.user_id)

      const balances = await taskRewards.getUserBalances(
        approvalRequest.user_id,
        trx,
        task.workspace_id
      )
      const assignment = await TaskAssignmentModel.findForUser(task.id, approvalRequest.user_id)

      return {
        xp_approval_request: updatedRequest,
        reward,
        user: balances,
        task: formatTask({
          ...task,
          completed_at: assignment?.completed_at ?? null,
        }),
      }
    })

    res.json(result)
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}

module.exports = { listPending, review }
