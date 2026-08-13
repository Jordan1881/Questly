const bcrypt = require('bcryptjs')
const UserModel = require('../models/user')
const PurchaseModel = require('../models/purchase')
const { formatTask } = require('./tasks')
const db = require('../config/db')
const SprintModel = require('../models/sprint')
const TaskAssignmentModel = require('../models/taskAssignment')
const WorkspaceMembershipModel = require('../models/workspaceMembership')
const taskRewards = require('../services/taskRewards')
const { mergePreferences } = require('../lib/userPreferences')
const avatarStorage = require('../lib/avatarStorage')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')
const { buildTeamStandings, computeLevel } = require('../lib/teamStandings')
const { TTLCache } = require('../lib/cache')

const SALT_ROUNDS = 12
// Bounded lengths avoid super-linear backtracking on crafted invalid input (S8786).
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/

// The team leaderboard changes only when someone's XP changes; a few seconds of
// staleness on OTHER members' standings is acceptable (the caller's own balances
// are always read fresh via attachAuthoritativeBalances). Cache the standings
// per workspace for a short TTL to avoid recomputing on every dashboard load.
// Disabled under test for deterministic assertions.
const STANDINGS_TTL_MS = Number(process.env.STANDINGS_CACHE_TTL_MS) || 10000
const standingsCache = new TTLCache({ defaultTtlMs: STANDINGS_TTL_MS })

function standingsCacheEnabled() {
  return process.env.NODE_ENV !== 'test' && STANDINGS_TTL_MS > 0
}

// Overwrite a formatted profile's balance fields with the authoritative source
// (workspace_memberships when MULTI_WORKSPACE is on, else the users table) so
// every profile response stays consistent with the dashboard.
async function attachAuthoritativeBalances(req, profile, fallbackWorkspaceId) {
  const workspaceId = req.workspaceId ?? fallbackWorkspaceId
  const balances = await taskRewards.getUserBalances(req.user.id, db, workspaceId)
  profile.currentSprintXp = balances.current_sprint_xp
  profile.lifetimeXp = balances.lifetime_xp
  profile.coinBalance = balances.coin_balance
  profile.level = computeLevel(profile.lifetimeXp)
  return profile
}

async function loadTeamStandings(workspaceId) {
  if (!workspaceId) return []

  const load = async () => {
    if (isMultiWorkspaceEnabled()) {
      const members = await WorkspaceMembershipModel.listActiveMembersWithProgress(workspaceId)
      // Developer climb only — match listDevelopersByWorkspace / sprint-reset scope.
      const developers = members.filter((m) => m.membership_role === 'developer')
      return buildTeamStandings(developers)
    }

    const developers = await UserModel.listDevelopersByWorkspace(workspaceId)
    return buildTeamStandings(developers)
  }

  if (!standingsCacheEnabled()) return load()
  return standingsCache.getOrLoad(`standings:${workspaceId}`, load)
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

    const workspaceId = req.workspaceId ?? user.workspace_id
    const balances = await taskRewards.getUserBalances(req.user.id, db, workspaceId)

    let activeSprint = null
    if (workspaceId) {
      const sprint = await SprintModel.findActiveByWorkspace(workspaceId)
      activeSprint = SprintModel.formatSprint(sprint)
    }

    const assignmentRows = workspaceId
      ? await TaskAssignmentModel.listForUser(req.user.id, workspaceId)
      : []
    const highPriorityTasks = assignmentRows
      .filter((row) => row.high_priority && !row.completed_at && row.status !== 'done')
      .slice(0, 5)
      .map(formatTask)

    const teamStandings = await loadTeamStandings(workspaceId)

    res.json({
      xp: {
        current_sprint_xp: balances.current_sprint_xp,
        lifetime_xp: balances.lifetime_xp,
        coin_balance: balances.coin_balance,
        level: computeLevel(balances.lifetime_xp),
      },
      streak: user.streak_days ?? 0,
      activeSprint,
      highPriorityTasks,
      teamStandings,
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
    await attachAuthoritativeBalances(req, profile, internal.workspace_id)

    const purchases = await PurchaseModel.listForUser(req.user.id)

    res.json({ profile, purchases })
  } catch (err) {
    next(err)
  }
}

function validateAge(age) {
  if (age === null || age === undefined || age === '') return { value: null }
  const parsed = Number.parseInt(age, 10)
  if (!Number.isInteger(parsed) || parsed < 13 || parsed > 120) {
    return { error: 'age must be between 13 and 120' }
  }
  return { value: parsed }
}

async function applyUsernameToPatch(patch, username, userId) {
  const trimmed = String(username).trim()
  if (trimmed.length < 2 || trimmed.length > 50) {
    return { status: 400, error: 'username must be 2–50 characters' }
  }
  const taken = await UserModel.findByUsername(trimmed, userId)
  if (taken) return { status: 400, error: 'username is already taken' }
  patch.username = trimmed
  return null
}

async function applyPreferencesToPatch(patch, preferences, userId) {
  if (typeof preferences !== 'object' || preferences === null || Array.isArray(preferences)) {
    return { status: 400, error: 'preferences must be an object' }
  }
  const internal = await UserModel.findByIdInternal(userId)
  patch.preferences = mergePreferences(internal?.preferences, preferences)
  return null
}

async function verifyEmailChange(userId, currentEmail, trimmedEmail, currentPassword) {
  if (trimmedEmail === currentEmail.toLowerCase()) return null
  if (!currentPassword) {
    return { status: 400, error: 'currentPassword is required to change email' }
  }
  const internal = await UserModel.findByIdInternal(userId)
  const valid = await bcrypt.compare(currentPassword, internal.password_hash)
  if (!valid) return { status: 400, error: 'current password is incorrect' }
  const taken = await UserModel.findByEmail(trimmedEmail)
  if (taken && taken.id !== userId) {
    return { status: 409, error: 'Email already registered' }
  }
  return null
}

async function applyEmailToPatch(patch, email, currentPassword, user) {
  const trimmedEmail = String(email).trim().toLowerCase()
  if (!EMAIL_RE.test(trimmedEmail)) {
    return { status: 400, error: 'email is invalid' }
  }
  const changeError = await verifyEmailChange(user.id, user.email, trimmedEmail, currentPassword)
  if (changeError) return changeError
  patch.email = trimmedEmail
  return null
}

async function buildProfilePatch(req) {
  const { username, avatarUrl, email, age, preferences, currentPassword } = req.body
  const patch = {}

  if (username !== undefined) {
    const err = await applyUsernameToPatch(patch, username, req.user.id)
    if (err) return err
  }

  if (avatarUrl !== undefined) {
    patch.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null
  }

  if (age !== undefined) {
    const ageResult = validateAge(age)
    if (ageResult.error) return { status: 400, error: ageResult.error }
    patch.age = ageResult.value
  }

  if (preferences !== undefined) {
    const err = await applyPreferencesToPatch(patch, preferences, req.user.id)
    if (err) return err
  }

  if (email !== undefined) {
    const err = await applyEmailToPatch(patch, email, currentPassword, req.user)
    if (err) return err
  }

  return { patch }
}

async function patchMe(req, res, next) {
  try {
    const result = await buildProfilePatch(req)
    if (result.error) {
      return res.status(result.status).json({ error: result.error })
    }

    const updated = await UserModel.updateProfile(req.user.id, result.patch)
    const profile = UserModel.formatPublicProfile(updated)
    await attachAuthoritativeBalances(req, profile, updated.workspace_id)

    res.json({ profile })
  } catch (err) {
    next(err)
  }
}

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'avatar file is required' })
    }

    const current = await UserModel.findByIdInternal(req.user.id)
    const avatarUrl = await avatarStorage.uploadAvatar(req.user.id, req.file)

    if (current?.avatar_url && current.avatar_url !== avatarUrl) {
      await avatarStorage.deleteManagedAvatar(current.avatar_url)
    }

    const updated = await UserModel.updateProfile(req.user.id, { avatarUrl })
    const profile = UserModel.formatPublicProfile(updated)
    await attachAuthoritativeBalances(req, profile, updated.workspace_id)

    res.json({ profile, avatarUrl })
  } catch (err) {
    if (err.code === 'AVATAR_TOO_SMALL') {
      return res.status(400).json({ error: err.message })
    }
    if (err.message?.startsWith('Avatar storage misconfigured')) {
      return res.status(500).json({ error: err.message })
    }
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
  uploadAvatar,
  listPurchases,
  deletePurchase,
  computeLevel,
}
