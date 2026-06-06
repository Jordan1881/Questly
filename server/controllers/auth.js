const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const UserModel = require('../models/user')
const WorkspaceModel = require('../models/workspace')
const jiraClient = require('../services/jiraClient')

const SALT_ROUNDS = 12
const INVALID_CREDENTIALS = 'Invalid credentials'

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  })
}

async function register(req, res, next) {
  try {
    const { email, username, password, role } = req.body
    if (!email || !username || !password || !role) {
      return res.status(400).json({ error: 'email, username, password and role are required' })
    }

    const existing = await UserModel.findByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await UserModel.create({ email, username, password_hash, role })
    const token = signToken(user)

    res.status(201).json({ user, token })
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

    const { password_hash, ...user } = row
    const token = signToken(user)

    res.status(200).json({ user, token })
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
    } = req.user

    res.json({
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
        jira_connected: UserModel.isJiraConnected(internal),
      },
    })
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

    const siteUrl = await resolveDeveloperJiraSiteUrl(req.user)
    if (!siteUrl) {
      return res.status(400).json({
        error: 'Jira site URL is not configured — ask your admin to connect the workspace first',
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
      return res.status(status).json({ error: err.message || 'Invalid Jira credentials' })
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

module.exports = { register, login, me, logout, connectJira, disconnectJira }
