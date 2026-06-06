const WorkspaceModel = require('../models/workspace')

function jiraSiteHostname(siteUrl) {
  if (!siteUrl) return null
  try {
    return new URL(siteUrl.replace(/\/$/, '')).hostname
  } catch {
    return null
  }
}

async function developerJiraContext(user) {
  if (!user?.workspace_id) {
    return {
      expected_jira_site_url: null,
      team_jira_site_host: null,
      team_jira_connected: false,
    }
  }

  const workspace = await WorkspaceModel.findById(user.workspace_id)
  const siteUrl = workspace?.jira_site_url || null

  return {
    expected_jira_site_url: siteUrl,
    team_jira_site_host: jiraSiteHostname(siteUrl),
    team_jira_connected: WorkspaceModel.isJiraConnected(workspace),
  }
}

module.exports = {
  jiraSiteHostname,
  developerJiraContext,
}
