const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const UserModel = require('../models/user')
const WorkspaceModel = require('../models/workspace')
const WorkspaceMembershipModel = require('../models/workspaceMembership')
const jiraClient = require('../services/jiraClient')
const { developerJiraContext } = require('../lib/jiraSiteContext')
const { formatDeveloperConnectError } = require('../lib/jiraConnectErrors')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')
const { parsePreferences } = require('../lib/userPreferences')

const SALT_ROUNDS = 12
const INVALID_CREDENTIALS = 'Invalid credentials'
const MIN_PASSWORD_LENGTH = 8

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  })
}

function buildSessionUser(internal) {
  const user = UserModel.strip(internal)
  return {
    ...user,
    jira_connected: UserModel.isJiraConnected(internal),
  }
}

async function register(req, res, next) {
  try {
    const { email, username, password, role } = req.body
    const multiWorkspace = isMultiWorkspaceEnabled()

    if (!email || !username || !password) {
      return res.status(400).json({
        error: multiWorkspace
          ? 'email, username and password are required'
          : 'email, username, password and role are required',
      })
    }

    if (!multiWorkspace && !role) {
      return res.status(400).json({ error: 'email, username, password and role are required' })
    }

    if (!multiWorkspace && role && !['admin', 'developer'].includes(role)) {
      return res.status(400).json({ error: 'role must be admin or developer' })
    }

    // Flag on: ignore client role — authority comes from memberships after create/join.
    const storedRole = multiWorkspace ? 'developer' : role

    const existing = await UserModel.findByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await UserModel.create({ email, username, password_hash, role: storedRole })
    const token = signToken(user)

    const payload = { user: { ...user, jira_connected: false }, token }
    if (multiWorkspace) {
      payload.memberships = []
      payload.active_workspace_id = null
    }

    res.status(201).json(payload)
  } catch (err) {
    next(err)
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const row = await UserModel.findByEmail(email)
    const valid = row && (await bcrypt.compare(password, row.password_hash))
    if (!valid) {
      return res.status(401).json({ error: INVALID_CREDENTIALS })
    }

    const token = signToken(row)

    res.status(200).json({ user: buildSessionUser(row), token })
  } catch (err) {
    next(err)
  }
}

async function me(req, res, next) {
  try {
    const internal = await UserModel.findByIdInternal(req.user.id)
    const {
      id,
      email,
      username,
      role,
      workspace_id,
      avatar_url,
      current_sprint_xp,
      lifetime_xp,
      coin_balance,
      streak_days,
      age,
      preferences,
    } = req.user

    const jiraContext = await developerJiraContext(req.user)

    const payload = {
      user: {
        id,
        email,
        username,
        role,
        workspace_id,
        avatar_url,
        current_sprint_xp,
        lifetime_xp,
        coin_balance,
        streak_days: streak_days ?? 0,
        age: age ?? null,
        preferences: parsePreferences(preferences),
        jira_connected: UserModel.isJiraConnected(internal),
        ...jiraContext,
      },
    }

    if (isMultiWorkspaceEnabled()) {
      Object.assign(payload, await WorkspaceMembershipModel.buildMembershipContext(req.user))
    }

    res.json(payload)
  } catch (err) {
    next(err)
  }
}

async function resolveDeveloperJiraSiteUrl(user) {
  if (user.workspace_id) {
    const workspace = await WorkspaceModel.findById(user.workspace_id)
    if (workspace?.jira_site_url) return workspace.jira_site_url
  }
  return config.jira.siteUrl
}

async function connectJira(req, res, next) {
  try {
    const accessToken = req.body.access_token || req.body.jira_access_token
    if (!accessToken) {
      return res.status(400).json({ error: 'access_token is required' })
    }

    if (!req.user.workspace_id) {
      return res.status(400).json({
        error:
          'Join a team first — connect Jira after your admin approves you to a workspace.',
      })
    }

    const siteUrl = await resolveDeveloperJiraSiteUrl(req.user)
    if (!siteUrl) {
      return res.status(400).json({
        error:
          "Your admin hasn't connected team Jira yet — ask them to connect Jira in Admin before you can link your account.",
      })
    }

    let accountId = req.body.jira_account_id || req.body.account_id || null

    try {
      const validation = await jiraClient.validateCredentials({
        siteUrl,
        email: req.user.email,
        apiToken: accessToken,
      })
      if (!accountId) accountId = validation.accountId
    } catch (err) {
      const status = err.status && err.status >= 400 && err.status < 500 ? 400 : 502
      return res.status(status).json({
        error: formatDeveloperConnectError(err, siteUrl),
      })
    }

    if (!accountId) {
      return res.status(400).json({
        error: 'Could not resolve Jira account ID — provide jira_account_id explicitly',
      })
    }

    const user = await UserModel.connectJira(req.user.id, {
      jira_access_token: accessToken,
      jira_account_id: accountId,
    })

    res.json({
      user: {
        ...user,
        jira_connected: true,
      },
    })
  } catch (err) {
    next(err)
  }
}

async function disconnectJira(req, res, next) {
  try {
    const user = await UserModel.disconnectJira(req.user.id)
    res.json({
      user: {
        ...user,
        jira_connected: false,
      },
    })
  } catch (err) {
    next(err)
  }
}

function logout(_req, res) {
  res.json({ message: 'Logged out' })
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' })
    }

    if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `newPassword must be at least ${MIN_PASSWORD_LENGTH} characters` })
    }

    const internal = await UserModel.findByIdInternal(req.user.id)
    const valid = await bcrypt.compare(currentPassword, internal.password_hash)
    if (!valid) {
      return res.status(400).json({ error: 'current password is incorrect' })
    }

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await UserModel.updatePassword(req.user.id, password_hash)

    res.json({ message: 'Password updated' })
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, me, logout, connectJira, disconnectJira, changePassword }
