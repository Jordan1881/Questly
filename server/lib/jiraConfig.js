const config = require('../config')

function isJiraFallbackEnabled() {
  return process.env.NODE_ENV === 'test' || process.env.JIRA_FALLBACK_ENABLED === 'true'
}

function workspaceHasJiraConfig(workspace) {
  return Boolean(
    workspace?.jira_site_url && workspace?.jira_project_key && workspace?.jira_access_token,
  )
}

function assertWorkspaceJiraReady(workspace) {
  if (workspaceHasJiraConfig(workspace) || isJiraFallbackEnabled()) return

  const err = new Error(
    'Workspace Jira is not connected — connect Jira in Admin before syncing tasks',
  )
  err.status = 503
  throw err
}

function configuredDeveloperShortcuts() {
  if (!isJiraFallbackEnabled()) {
    return { developerEmail: null, developerAccountId: null }
  }

  return {
    developerEmail: process.env.JIRA_DEVELOPER_EMAIL || null,
    developerAccountId:
      process.env.JIRA_DEVELOPER_ACCOUNT_ID || process.env.JIRA_ACCOUNT_ID || null,
  }
}

function platformJiraConfig() {
  if (!isJiraFallbackEnabled()) return null
  return config.jira
}

module.exports = {
  isJiraFallbackEnabled,
  workspaceHasJiraConfig,
  assertWorkspaceJiraReady,
  configuredDeveloperShortcuts,
  platformJiraConfig,
}
