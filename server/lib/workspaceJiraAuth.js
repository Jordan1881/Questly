const WorkspaceModel = require('../models/workspace')
const atlassianOAuth = require('../services/atlassianOAuth')

async function ensureFreshWorkspaceToken(workspace) {
  if (!workspace || workspace.jira_auth_type !== 'oauth' || !workspace.jira_refresh_token) {
    return workspace
  }

  const tokens = await atlassianOAuth.refreshAccessToken(workspace.jira_refresh_token)
  return WorkspaceModel.updateOAuthTokens(workspace.id, {
    jira_access_token: tokens.access_token,
    jira_refresh_token: tokens.refresh_token || workspace.jira_refresh_token,
  })
}

module.exports = {
  ensureFreshWorkspaceToken,
}
