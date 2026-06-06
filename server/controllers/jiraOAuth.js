const jwt = require('jsonwebtoken')
const config = require('../config')
const UserModel = require('../models/user')
const WorkspaceModel = require('../models/workspace')
const atlassianOAuth = require('../services/atlassianOAuth')

const STATE_PURPOSE = 'jira-oauth'

function isSafeReturnPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

function createOAuthState(userId, returnTo = '/dashboard') {
  return jwt.sign(
    { sub: userId, purpose: STATE_PURPOSE, returnTo },
    config.jwt.secret,
    { expiresIn: '15m' },
  )
}

function verifyOAuthState(state) {
  const payload = jwt.verify(state, config.jwt.secret)
  if (payload.purpose !== STATE_PURPOSE || !payload.sub) {
    throw new Error('Invalid OAuth state')
  }
  return {
    userId: payload.sub,
    returnTo: isSafeReturnPath(payload.returnTo) ? payload.returnTo : '/dashboard',
  }
}

function redirectToFrontend(res, returnTo, params = {}) {
  const url = new URL(returnTo, config.frontendUrl)
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) url.searchParams.set(key, value)
  })
  res.redirect(url.toString())
}

async function resolveDeveloperJiraSiteUrl(user) {
  if (user.workspace_id) {
    const workspace = await WorkspaceModel.findById(user.workspace_id)
    if (workspace?.jira_site_url) return workspace.jira_site_url
  }
  return config.jira.siteUrl
}

async function oauthStatus(_req, res) {
  res.json({ available: atlassianOAuth.isConfigured() })
}

async function oauthStart(req, res, next) {
  try {
    if (!atlassianOAuth.isConfigured()) {
      return res.status(503).json({ error: 'Atlassian OAuth is not configured on this server' })
    }

    if (req.user.role !== 'developer') {
      return res.status(403).json({ error: 'Only developers can connect a personal Jira account' })
    }

    const returnTo = isSafeReturnPath(req.query.return_to) ? req.query.return_to : '/dashboard'
    const state = createOAuthState(req.user.id, returnTo)

    res.json({
      authorize_url: atlassianOAuth.buildAuthorizeUrl({ state }),
      state,
    })
  } catch (err) {
    next(err)
  }
}

async function oauthCallback(req, res, next) {
  let returnTo = '/dashboard'

  try {
    const { code, state, error: oauthError, error_description: errorDescription } = req.query

    let userId
    try {
      if (!state) throw new Error('Missing OAuth state')
      const verified = verifyOAuthState(state)
      userId = verified.userId
      returnTo = verified.returnTo
    } catch {
      return redirectToFrontend(res, '/dashboard', {
        jira_oauth: 'error',
        jira_oauth_reason: 'invalid_state',
      })
    }

    if (oauthError) {
      const reason = oauthError === 'access_denied' ? 'denied' : 'oauth_error'
      return redirectToFrontend(res, returnTo, {
        jira_oauth: 'error',
        jira_oauth_reason: reason,
        jira_oauth_detail: errorDescription || oauthError,
      })
    }

    if (!code) {
      return redirectToFrontend(res, returnTo, {
        jira_oauth: 'error',
        jira_oauth_reason: 'missing_code',
      })
    }

    if (!atlassianOAuth.isConfigured()) {
      return redirectToFrontend(res, returnTo, {
        jira_oauth: 'error',
        jira_oauth_reason: 'not_configured',
      })
    }

    const user = await UserModel.findByIdInternal(userId)
    if (!user || user.role !== 'developer') {
      return redirectToFrontend(res, returnTo, {
        jira_oauth: 'error',
        jira_oauth_reason: 'invalid_user',
      })
    }

    const tokens = await atlassianOAuth.exchangeAuthorizationCode(code)
    const profile = await atlassianOAuth.fetchAuthenticatedUser(tokens.access_token)

    if (
      profile.email &&
      user.email &&
      profile.email.toLowerCase() !== user.email.toLowerCase()
    ) {
      return redirectToFrontend(res, returnTo, {
        jira_oauth: 'error',
        jira_oauth_reason: 'wrong_account',
      })
    }

    const siteUrl = await resolveDeveloperJiraSiteUrl(user)
    if (siteUrl) {
      const resources = await atlassianOAuth.fetchAccessibleResources(tokens.access_token)
      if (!atlassianOAuth.siteUrlInResources(siteUrl, resources)) {
        return redirectToFrontend(res, returnTo, {
          jira_oauth: 'error',
          jira_oauth_reason: 'site_not_granted',
        })
      }
    }

    const accountId = profile.account_id || profile.accountId
    if (!accountId) {
      return redirectToFrontend(res, returnTo, {
        jira_oauth: 'error',
        jira_oauth_reason: 'missing_account_id',
      })
    }

    await UserModel.connectJira(userId, {
      jira_access_token: tokens.access_token,
      jira_refresh_token: tokens.refresh_token || null,
      jira_account_id: accountId,
    })

    redirectToFrontend(res, returnTo, { jira_oauth: 'success' })
  } catch (err) {
    redirectToFrontend(res, returnTo, {
      jira_oauth: 'error',
      jira_oauth_reason: 'exchange_failed',
      jira_oauth_detail: err.message,
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
