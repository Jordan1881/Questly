const jwt = require('jsonwebtoken')
const config = require('../config')
const UserModel = require('../models/user')
const WorkspaceModel = require('../models/workspace')
const atlassianOAuth = require('../services/atlassianOAuth')
const UserJiraOAuthPending = require('../models/userJiraOAuthPending')

const STATE_PURPOSE = 'jira-oauth'

function isSafeReturnPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

function normalizeSiteUrl(siteUrl) {
  return (siteUrl || '').replace(/\/$/, '').toLowerCase()
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

/** Team workspace site only — no platform fallback (free-picker when absent). */
async function resolveTeamJiraSiteUrl(user) {
  if (!user?.workspace_id) return null
  const workspace = await WorkspaceModel.findById(user.workspace_id)
  return workspace?.jira_site_url || null
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

async function oauthCallback(req, res) {
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

    if (!tokens?.access_token) {
      return redirectToFrontend(res, returnTo, {
        jira_oauth: 'error',
        jira_oauth_reason: 'exchange_failed',
      })
    }

    const accountId = profile.account_id || profile.accountId
    if (!accountId) {
      return redirectToFrontend(res, returnTo, {
        jira_oauth: 'error',
        jira_oauth_reason: 'missing_account_id',
      })
    }

    await UserJiraOAuthPending.upsert({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
    })

    redirectToFrontend(res, returnTo, { jira_oauth: 'pending' })
  } catch (err) {
    redirectToFrontend(res, returnTo, {
      jira_oauth: 'error',
      jira_oauth_reason: 'exchange_failed',
      jira_oauth_detail: err.message,
    })
  }
}

async function getPending(req, res, next) {
  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const status = await UserJiraOAuthPending.getStatus(req.user.id)
    if (status.status === 'missing') {
      return res.status(404).json({ error: 'No pending OAuth session' })
    }
    if (status.status === 'expired') {
      return res.status(410).json({ error: 'Pending OAuth session expired' })
    }

    const teamSiteUrl = await resolveTeamJiraSiteUrl(req.user)
    res.json({
      pending: true,
      expires_at: status.expires_at,
      locked_site_url: teamSiteUrl,
      site_locked: Boolean(teamSiteUrl),
    })
  } catch (err) {
    next(err)
  }
}

async function cancelPending(req, res, next) {
  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    await UserJiraOAuthPending.deleteFor(req.user.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

async function listPendingSites(req, res, next) {
  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const session = await UserJiraOAuthPending.findUsable(req.user.id)
    if (!session) {
      return res.status(404).json({ error: 'No pending OAuth session' })
    }

    const teamSiteUrl = await resolveTeamJiraSiteUrl(req.user)
    const resources = await atlassianOAuth.fetchAccessibleResources(session.accessToken)
    const sites = (resources || []).map((resource) => ({
      id: resource.id,
      url: resource.url,
      name: resource.name || resource.url,
    }))

    if (!sites.length) {
      await UserJiraOAuthPending.deleteFor(req.user.id)
      return res.status(422).json({
        error: 'No Atlassian sites found for this account. Use Advanced API token connect, or authorize a different Atlassian account.',
      })
    }

    if (teamSiteUrl) {
      const locked = sites.find((s) => normalizeSiteUrl(s.url) === normalizeSiteUrl(teamSiteUrl))
      if (!locked) {
        await UserJiraOAuthPending.deleteFor(req.user.id)
        return res.status(422).json({
          error: 'Your Atlassian account does not include the team Jira site. Grant access to that site, or ask your admin.',
        })
      }
      return res.json({
        sites: [locked],
        site_locked: true,
        locked_site_url: teamSiteUrl,
      })
    }

    res.json({ sites, site_locked: false, locked_site_url: null })
  } catch (err) {
    next(err)
  }
}

async function confirmPendingSite(req, res, next) {
  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const siteUrl = (req.body?.site_url || '').trim()
    if (!siteUrl) {
      return res.status(400).json({ error: 'site_url is required' })
    }

    const session = await UserJiraOAuthPending.findUsable(req.user.id)
    if (!session) {
      return res.status(404).json({ error: 'No pending OAuth session' })
    }

    const teamSiteUrl = await resolveTeamJiraSiteUrl(req.user)
    if (teamSiteUrl && normalizeSiteUrl(siteUrl) !== normalizeSiteUrl(teamSiteUrl)) {
      return res.status(400).json({
        error: 'Confirm the team Jira site — a different site cannot be selected',
      })
    }

    const resources = await atlassianOAuth.fetchAccessibleResources(session.accessToken)
    const resource = atlassianOAuth.findResourceForSiteUrl(siteUrl, resources)
    if (!resource) {
      return res.status(400).json({ error: 'Selected site is not in your accessible Atlassian sites' })
    }

    const profile = await atlassianOAuth.fetchAuthenticatedUser(session.accessToken)
    const accountId = profile.account_id || profile.accountId
    if (!accountId) {
      return res.status(502).json({ error: 'Could not resolve Atlassian account id' })
    }

    const user = await UserModel.connectJira(req.user.id, {
      jira_access_token: session.accessToken,
      jira_refresh_token: session.refreshToken,
      jira_account_id: accountId,
      jira_site_url: resource.url,
    })

    await UserJiraOAuthPending.deleteFor(req.user.id)

    res.json({
      user: {
        ...user,
        jira_connected: UserModel.isJiraConnected(user),
        jira_site_url: resource.url,
      },
      confirmed_site_url: resource.url,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  oauthStatus,
  oauthStart,
  oauthCallback,
  getPending,
  cancelPending,
  listPendingSites,
  confirmPendingSite,
  createOAuthState,
  verifyOAuthState,
  resolveTeamJiraSiteUrl,
}
