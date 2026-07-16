const jwt = require('jsonwebtoken')
const config = require('../config')
const UserModel = require('../models/user')
const WorkspaceModel = require('../models/workspace')
const atlassianOAuth = require('../services/atlassianOAuth')
const { userCanAdminWorkspace } = require('../lib/workspaceAuth')

const STATE_PURPOSE = 'workspace-jira-oauth'
const WORKSPACE_CALLBACK_URL = () => config.atlassian.workspaceCallbackUrl

function isSafeReturnPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

function createOAuthState({ userId, workspaceId, returnTo, jiraSiteUrl = null, jiraProjectKey = null }) {
  const payload = {
    sub: userId,
    workspaceId,
    purpose: STATE_PURPOSE,
    returnTo,
  }
  // Optional legacy fields — Phase 1 pickers no longer require them at start.
  if (jiraSiteUrl) payload.jiraSiteUrl = jiraSiteUrl
  if (jiraProjectKey) payload.jiraProjectKey = jiraProjectKey
  return jwt.sign(payload, config.jwt.secret, { expiresIn: '15m' })
}

function verifyOAuthState(state) {
  const payload = jwt.verify(state, config.jwt.secret)
  if (payload.purpose !== STATE_PURPOSE || !payload.sub || !payload.workspaceId) {
    throw new Error('Invalid OAuth state')
  }

  return {
    userId: payload.sub,
    workspaceId: payload.workspaceId,
    returnTo: isSafeReturnPath(payload.returnTo) ? payload.returnTo : '/admin',
    jiraSiteUrl: payload.jiraSiteUrl,
    jiraProjectKey: payload.jiraProjectKey,
  }
}

function redirectToFrontend(res, returnTo, params = {}) {
  const url = new URL(returnTo, config.frontendUrl)
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) url.searchParams.set(key, value)
  })
  res.redirect(url.toString())
}

async function oauthStatus(_req, res) {
  res.json({ available: atlassianOAuth.isConfigured(WORKSPACE_CALLBACK_URL()) })
}

async function oauthStart(req, res, next) {
  try {
    if (!atlassianOAuth.isConfigured(WORKSPACE_CALLBACK_URL())) {
      return res.status(503).json({ error: 'Atlassian OAuth is not configured on this server' })
    }

    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (!(await userCanAdminWorkspace(req.user, workspace))) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const jiraSiteUrl = (req.query.jira_site_url || '').trim() || null
    const jiraProjectKey = (req.query.jira_project_key || '').trim() || null
    const returnTo = isSafeReturnPath(req.query.return_to) ? req.query.return_to : '/admin'
    const state = createOAuthState({
      userId: req.user.id,
      workspaceId: workspace.id,
      returnTo,
      jiraSiteUrl,
      jiraProjectKey,
    })

    res.json({
      authorize_url: atlassianOAuth.buildAuthorizeUrl({
        state,
        callbackUrl: WORKSPACE_CALLBACK_URL(),
      }),
      state,
    })
  } catch (err) {
    next(err)
  }
}

async function oauthCallback(req, res) {
  let returnTo = '/admin'

  try {
    const { code, state, error: oauthError, error_description: errorDescription } = req.query

    let userId
    let workspaceId
    try {
      if (!state) throw new Error('Missing OAuth state')
      const verified = verifyOAuthState(state)
      userId = verified.userId
      workspaceId = verified.workspaceId
      returnTo = verified.returnTo
    } catch {
      return redirectToFrontend(res, '/admin', {
        workspace_jira_oauth: 'error',
        workspace_jira_oauth_reason: 'invalid_state',
      })
    }

    if (oauthError) {
      const reason = oauthError === 'access_denied' ? 'denied' : 'oauth_error'
      return redirectToFrontend(res, returnTo, {
        workspace_jira_oauth: 'error',
        workspace_jira_oauth_reason: reason,
        workspace_jira_oauth_detail: errorDescription || oauthError,
      })
    }

    if (!code) {
      return redirectToFrontend(res, returnTo, {
        workspace_jira_oauth: 'error',
        workspace_jira_oauth_reason: 'missing_code',
      })
    }

    if (!atlassianOAuth.isConfigured(WORKSPACE_CALLBACK_URL())) {
      return redirectToFrontend(res, returnTo, {
        workspace_jira_oauth: 'error',
        workspace_jira_oauth_reason: 'not_configured',
      })
    }

    const workspace = await WorkspaceModel.findById(workspaceId)
    const admin = await UserModel.findByIdInternal(userId)
    if (!workspace || !admin || !(await userCanAdminWorkspace(admin, workspace))) {
      return redirectToFrontend(res, returnTo, {
        workspace_jira_oauth: 'error',
        workspace_jira_oauth_reason: 'invalid_workspace',
      })
    }

    const tokens = await atlassianOAuth.exchangeAuthorizationCode(code, WORKSPACE_CALLBACK_URL())
    const profile = await atlassianOAuth.fetchAuthenticatedUser(tokens.access_token)

    if (
      profile.email &&
      admin.email &&
      profile.email.toLowerCase() !== admin.email.toLowerCase()
    ) {
      return redirectToFrontend(res, returnTo, {
        workspace_jira_oauth: 'error',
        workspace_jira_oauth_reason: 'wrong_account',
      })
    }

    // T0 prefactor: validate Atlassian account only — do not finalize workspace
    // Jira connect. Pending-session persistence lands in #272+.
    if (!tokens?.access_token) {
      return redirectToFrontend(res, returnTo, {
        workspace_jira_oauth: 'error',
        workspace_jira_oauth_reason: 'exchange_failed',
      })
    }

    redirectToFrontend(res, returnTo, { workspace_jira_oauth: 'pending' })
  } catch (err) {
    redirectToFrontend(res, returnTo, {
      workspace_jira_oauth: 'error',
      workspace_jira_oauth_reason: 'exchange_failed',
      workspace_jira_oauth_detail: err.message,
    })
  }
}

module.exports = {
  oauthStatus,
  oauthStart,
  oauthCallback,
  createOAuthState,
  verifyOAuthState,
}
