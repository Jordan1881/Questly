const UserModel = require('../models/user')
const PurchaseModel = require('../models/purchase')
const { formatTask } = require('./tasks')
const db = require('../config/db')
const SprintModel = require('../models/sprint')
const TaskAssignmentModel = require('../models/taskAssignment')

const LEVEL_SIZE = 1000

function computeLevel(lifetimeXp) {
  return Math.floor(Math.max(0, lifetimeXp ?? 0) / LEVEL_SIZE) + 1
}

async function xpHistory(req, res, next) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200)

    const rows = await db('xp_transactions')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .select('id', 'amount', 'reason', 'task_id', 'created_at')

    res.json({
      transactions: rows.map((row) => ({
        id: row.id,
        amount: row.amount,
        reason: row.reason,
        taskId: row.task_id,
        createdAt: row.created_at,
      })),
    })
  } catch (err) {
    next(err)
  }
}

async function dashboard(req, res, next) {
  try {
    const user = await db('users').where({ id: req.user.id }).first()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    let activeSprint = null
    if (user.workspace_id) {
      const sprint = await SprintModel.findActiveByWorkspace(user.workspace_id)
      activeSprint = SprintModel.formatSprint(sprint)
    }

    const assignmentRows = await TaskAssignmentModel.listForUser(req.user.id)
    const highPriorityTasks = assignmentRows
      .filter((row) => row.high_priority && !row.completed_at && row.status !== 'done')
      .slice(0, 5)
      .map(formatTask)

    res.json({
      xp: {
        current_sprint_xp: user.current_sprint_xp ?? 0,
        lifetime_xp: user.lifetime_xp ?? 0,
        coin_balance: user.coin_balance ?? 0,
        level: computeLevel(user.lifetime_xp),
      },
      streak: user.streak_days ?? 0,
      activeSprint,
      highPriorityTasks,
    })
  } catch (err) {
    next(err)
  }
}

async function getMe(req, res, next) {
  try {
    const internal = await UserModel.findByIdInternal(req.user.id)
    if (!internal) return res.status(404).json({ error: 'User not found' })

    const profile = UserModel.formatPublicProfile(internal)
    profile.level = computeLevel(profile.lifetimeXp)

    const purchases = await PurchaseModel.listForUser(req.user.id)

    res.json({ profile, purchases })
  } catch (err) {
    next(err)
  }
}

async function patchMe(req, res, next) {
  try {
    const { username, avatarUrl } = req.body

    if (username !== undefined) {
      const trimmed = String(username).trim()
      if (trimmed.length < 2 || trimmed.length > 50) {
        return res.status(400).json({ error: 'username must be 2–50 characters' })
      }

      const taken = await UserModel.findByUsername(trimmed, req.user.id)
      if (taken) {
        return res.status(400).json({ error: 'username is already taken' })
      }
    }

    const updated = await UserModel.updateProfile(req.user.id, { username, avatarUrl })
    const profile = UserModel.formatPublicProfile(updated)
    profile.level = computeLevel(profile.lifetimeXp)

    res.json({ profile })
  } catch (err) {
    next(err)
  }
}

async function listPurchases(req, res, next) {
  try {
    const purchases = await PurchaseModel.listForUser(req.user.id)
    res.json({ purchases })
  } catch (err) {
    next(err)
  }
}

async function deletePurchase(req, res, next) {
  try {
    const deleted = await PurchaseModel.softDelete(req.params.id, req.user.id)
    if (!deleted) {
      return res.status(404).json({ error: 'Purchase not found' })
    }

    res.json({
      purchase: {
        id: deleted.id,
        deletedAt: deleted.deleted_at,
      },
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  xpHistory,
  dashboard,
  getMe,
  patchMe,
  listPurchases,
  deletePurchase,
  computeLevel,
}
