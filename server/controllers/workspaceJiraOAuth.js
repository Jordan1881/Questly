const jwt = require('jsonwebtoken')
const config = require('../config')
const UserModel = require('../models/user')
const WorkspaceModel = require('../models/workspace')
const atlassianOAuth = require('../services/atlassianOAuth')
const { isWorkspaceAdmin } = require('../lib/workspaceAuth')

const STATE_PURPOSE = 'workspace-jira-oauth'
const WORKSPACE_CALLBACK_URL = () => config.atlassian.workspaceCallbackUrl

function isSafeReturnPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

function createOAuthState({ userId, workspaceId, returnTo, jiraSiteUrl, jiraProjectKey }) {
  return jwt.sign(
    {
      sub: userId,
      workspaceId,
      purpose: STATE_PURPOSE,
      returnTo,
      jiraSiteUrl,
      jiraProjectKey,
    },
    config.jwt.secret,
    { expiresIn: '15m' },
  )
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

    if (!isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const jiraSiteUrl = (req.query.jira_site_url || '').trim()
    const jiraProjectKey = (req.query.jira_project_key || '').trim()
    if (!jiraSiteUrl || !jiraProjectKey) {
      return res.status(400).json({ error: 'jira_site_url and jira_project_key are required' })
    }

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
    let jiraSiteUrl
    let jiraProjectKey
    try {
      if (!state) throw new Error('Missing OAuth state')
      const verified = verifyOAuthState(state)
      userId = verified.userId
      workspaceId = verified.workspaceId
      returnTo = verified.returnTo
      jiraSiteUrl = verified.jiraSiteUrl
      jiraProjectKey = verified.jiraProjectKey
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
    if (!workspace || !admin || !isWorkspaceAdmin(admin, workspace)) {
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

    const resources = await atlassianOAuth.fetchAccessibleResources(tokens.access_token)
    const resource = atlassianOAuth.findResourceForSiteUrl(jiraSiteUrl, resources)
    if (!resource) {
      return redirectToFrontend(res, returnTo, {
        workspace_jira_oauth: 'error',
        workspace_jira_oauth_reason: 'site_not_granted',
      })
    }

    await WorkspaceModel.connectJiraOAuth(workspaceId, {
      jira_site_url: jiraSiteUrl,
      jira_project_key: jiraProjectKey,
      jira_access_token: tokens.access_token,
      jira_refresh_token: tokens.refresh_token || null,
      jira_cloud_id: resource.id,
    })

    redirectToFrontend(res, returnTo, { workspace_jira_oauth: 'success' })
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
