const jwt = require('jsonwebtoken')
const config = require('../config')
const UserModel = require('../models/user')
const WorkspaceModel = require('../models/workspace')
const atlassianOAuth = require('../services/atlassianOAuth')
const jiraClient = require('../services/jiraClient')
const jiraSync = require('../services/jiraSync')
const { userCanAdminWorkspace } = require('../lib/workspaceAuth')
const JiraOAuthPending = require('../models/jiraOAuthPending')

const STATE_PURPOSE = 'workspace-jira-oauth'
const WORKSPACE_CALLBACK_URL = () => config.atlassian.workspaceCallbackUrl

function isSafeReturnPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

function createOAuthState({
  userId,
  workspaceId,
  returnTo,
  jiraSiteUrl = null,
  jiraProjectKey = null,
  mode = null,
}) {
  const payload = {
    sub: userId,
    workspaceId,
    purpose: STATE_PURPOSE,
    returnTo,
  }
  // Optional legacy fields — Phase 1 pickers no longer require them at start.
  if (jiraSiteUrl) payload.jiraSiteUrl = jiraSiteUrl
  if (jiraProjectKey) payload.jiraProjectKey = jiraProjectKey
  if (mode) payload.mode = mode
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
    mode: payload.mode === 'reconnect' || payload.mode === 'change' ? payload.mode : null,
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
    const modeRaw = (req.query.mode || '').trim()
    const mode = modeRaw === 'reconnect' || modeRaw === 'change' ? modeRaw : null

    if (mode === 'reconnect') {
      if (!WorkspaceModel.isJiraConnected(workspace) || workspace.jira_auth_type !== 'oauth') {
        return res.status(400).json({
          error: 'Reconnect requires an existing OAuth Jira connection on this workspace',
        })
      }
    }

    const state = createOAuthState({
      userId: req.user.id,
      workspaceId: workspace.id,
      returnTo,
      jiraSiteUrl,
      jiraProjectKey,
      mode,
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
    let mode = null
    try {
      if (!state) throw new Error('Missing OAuth state')
      const verified = verifyOAuthState(state)
      userId = verified.userId
      workspaceId = verified.workspaceId
      returnTo = verified.returnTo
      mode = verified.mode
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

    if (!tokens?.access_token) {
      return redirectToFrontend(res, returnTo, {
        workspace_jira_oauth: 'error',
        workspace_jira_oauth_reason: 'exchange_failed',
      })
    }

    if (mode === 'reconnect') {
      if (!WorkspaceModel.isJiraConnected(workspace) || !workspace.jira_site_url) {
        return redirectToFrontend(res, returnTo, {
          workspace_jira_oauth: 'error',
          workspace_jira_oauth_reason: 'not_connected',
        })
      }

      const resources = await atlassianOAuth.fetchAccessibleResources(tokens.access_token)
      const resource = atlassianOAuth.findResourceForSiteUrl(workspace.jira_site_url, resources)
      if (!resource) {
        return redirectToFrontend(res, returnTo, {
          workspace_jira_oauth: 'error',
          workspace_jira_oauth_reason: 'site_not_granted',
        })
      }

      await WorkspaceModel.connectJiraOAuth(workspace.id, {
        jira_site_url: workspace.jira_site_url,
        jira_project_key: workspace.jira_project_key,
        jira_access_token: tokens.access_token,
        jira_refresh_token: tokens.refresh_token || workspace.jira_refresh_token,
        jira_cloud_id: resource.id || workspace.jira_cloud_id,
      })
      await JiraOAuthPending.deleteFor(userId, workspaceId)

      return redirectToFrontend(res, returnTo, { workspace_jira_oauth: 'success' })
    }

    await JiraOAuthPending.upsert({
      userId,
      workspaceId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
    })

    redirectToFrontend(res, returnTo, { workspace_jira_oauth: 'pending' })
  } catch (err) {
    redirectToFrontend(res, returnTo, {
      workspace_jira_oauth: 'error',
      workspace_jira_oauth_reason: 'exchange_failed',
      workspace_jira_oauth_detail: err.message,
    })
  }
}

async function assertAdminWorkspace(req, res) {
  const workspace = await WorkspaceModel.findById(req.params.id)
  if (!workspace) {
    res.status(404).json({ error: 'Workspace not found' })
    return null
  }
  if (!(await userCanAdminWorkspace(req.user, workspace))) {
    res.status(403).json({ error: 'Forbidden' })
    return null
  }
  return workspace
}

async function getPending(req, res, next) {
  try {
    const workspace = await assertAdminWorkspace(req, res)
    if (!workspace) return

    const status = await JiraOAuthPending.getStatus(req.user.id, workspace.id)
    if (status.status === 'missing') {
      return res.status(404).json({ error: 'No pending OAuth session' })
    }
    if (status.status === 'expired') {
      return res.status(410).json({ error: 'Pending OAuth session expired' })
    }

    res.json({
      pending: true,
      expires_at: status.expires_at,
      selected_site_url: status.selected_site_url || null,
      selected_cloud_id: status.selected_cloud_id || null,
    })
  } catch (err) {
    next(err)
  }
}

async function cancelPending(req, res, next) {
  try {
    const workspace = await assertAdminWorkspace(req, res)
    if (!workspace) return

    await JiraOAuthPending.deleteFor(req.user.id, workspace.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

function mapAccessibleSites(resources) {
  return (resources || []).map((resource) => ({
    id: resource.id,
    url: resource.url,
    name: resource.name || resource.url,
  }))
}

async function listPendingSites(req, res, next) {
  try {
    const workspace = await assertAdminWorkspace(req, res)
    if (!workspace) return

    const session = await JiraOAuthPending.findUsable(req.user.id, workspace.id)
    if (!session) {
      return res.status(404).json({ error: 'No pending OAuth session' })
    }

    const resources = await atlassianOAuth.fetchAccessibleResources(session.accessToken)
    const sites = mapAccessibleSites(resources)
    if (!sites.length) {
      await JiraOAuthPending.deleteFor(req.user.id, workspace.id)
      return res.status(422).json({
        error: 'No Atlassian sites found for this account. Use Advanced API token connect, or authorize a different Atlassian account.',
      })
    }

    res.json({ sites })
  } catch (err) {
    next(err)
  }
}

async function confirmPendingSite(req, res, next) {
  try {
    const workspace = await assertAdminWorkspace(req, res)
    if (!workspace) return

    const siteUrl = (req.body?.site_url || '').trim()
    if (!siteUrl) {
      return res.status(400).json({ error: 'site_url is required' })
    }

    const session = await JiraOAuthPending.findUsable(req.user.id, workspace.id)
    if (!session) {
      return res.status(404).json({ error: 'No pending OAuth session' })
    }

    const resources = await atlassianOAuth.fetchAccessibleResources(session.accessToken)
    const resource = atlassianOAuth.findResourceForSiteUrl(siteUrl, resources)
    if (!resource) {
      return res.status(400).json({ error: 'Selected site is not in your accessible Atlassian sites' })
    }

    const updated = await JiraOAuthPending.selectSite(req.user.id, workspace.id, {
      siteUrl: resource.url,
      cloudId: resource.id,
    })
    if (!updated) {
      return res.status(404).json({ error: 'No pending OAuth session' })
    }

    res.json({
      pending: true,
      selected_site_url: updated.selectedSiteUrl,
      selected_cloud_id: updated.selectedCloudId,
      expires_at: new Date(updated.expiresAt).toISOString(),
    })
  } catch (err) {
    next(err)
  }
}

async function listPendingProjects(req, res, next) {
  try {
    const workspace = await assertAdminWorkspace(req, res)
    if (!workspace) return

    const session = await JiraOAuthPending.findUsable(req.user.id, workspace.id)
    if (!session) {
      return res.status(404).json({ error: 'No pending OAuth session' })
    }
    if (!session.selectedSiteUrl || !session.selectedCloudId) {
      return res.status(400).json({ error: 'Confirm a Jira site before listing projects' })
    }

    const projects = await jiraClient.listProjects({
      siteUrl: session.selectedSiteUrl,
      cloudId: session.selectedCloudId,
      bearerToken: session.accessToken,
    })

    res.json({ projects })
  } catch (err) {
    next(err)
  }
}

async function confirmPendingProject(req, res, next) {
  try {
    const workspace = await assertAdminWorkspace(req, res)
    if (!workspace) return

    const projectKey = (req.body?.project_key || '').trim()
    if (!projectKey) {
      return res.status(400).json({ error: 'project_key is required' })
    }

    const session = await JiraOAuthPending.findUsable(req.user.id, workspace.id)
    if (!session) {
      return res.status(404).json({ error: 'No pending OAuth session' })
    }
    if (!session.selectedSiteUrl || !session.selectedCloudId) {
      return res.status(400).json({ error: 'Confirm a Jira site before confirming a project' })
    }

    const projects = await jiraClient.listProjects({
      siteUrl: session.selectedSiteUrl,
      cloudId: session.selectedCloudId,
      bearerToken: session.accessToken,
    })
    const project = projects.find((p) => p.key.toUpperCase() === projectKey.toUpperCase())
    if (!project) {
      return res.status(400).json({ error: 'Selected project is not accessible on this Jira site' })
    }

    const connected = await WorkspaceModel.connectJiraOAuth(workspace.id, {
      jira_site_url: session.selectedSiteUrl,
      jira_project_key: project.key,
      jira_access_token: session.accessToken,
      jira_refresh_token: session.refreshToken,
      jira_cloud_id: session.selectedCloudId,
    })

    await JiraOAuthPending.deleteFor(req.user.id, workspace.id)

    let sync = null
    let sync_error = null
    try {
      sync = await jiraSync.syncWorkspaceTasks(connected)
    } catch (err) {
      sync_error = err.message || 'Jira sync failed after connect'
    }

    res.json({
      workspace: WorkspaceModel.sanitize(connected),
      sync,
      sync_error,
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
  listPendingProjects,
  confirmPendingProject,
  createOAuthState,
  verifyOAuthState,
}
