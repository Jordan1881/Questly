const WorkspaceModel = require('../models/workspace')

function jiraSiteHostname(siteUrl) {
  if (!siteUrl) return null
  try {
    return new URL(siteUrl.replace(/\/$/, '')).hostname
  } catch {
    return null
  }
}

function normalizeSiteUrl(siteUrl) {
  return (siteUrl || '').replace(/\/$/, '').toLowerCase()
}

function sitesMismatch(personalSiteUrl, teamSiteUrl) {
  if (!personalSiteUrl || !teamSiteUrl) return false
  return normalizeSiteUrl(personalSiteUrl) !== normalizeSiteUrl(teamSiteUrl)
}

async function developerJiraContext(user) {
  if (!user?.workspace_id) {
    return {
      expected_jira_site_url: null,
      team_jira_site_host: null,
      team_jira_connected: false,
      personal_jira_site_url: user?.jira_site_url || null,
      personal_jira_site_mismatch: false,
    }
  }

  const workspace = await WorkspaceModel.findById(user.workspace_id)
  const siteUrl = workspace?.jira_site_url || null
  const personalSiteUrl = user.jira_site_url || null

  return {
    expected_jira_site_url: siteUrl,
    team_jira_site_host: jiraSiteHostname(siteUrl),
    team_jira_connected: WorkspaceModel.isJiraConnected(workspace),
    personal_jira_site_url: personalSiteUrl,
    personal_jira_site_mismatch: sitesMismatch(personalSiteUrl, siteUrl),
  }
}

function publicWorkspaceLookup(workspace) {
  if (!workspace) return null

  const siteUrl = workspace.jira_site_url || null

  return {
    id: workspace.id,
    name: workspace.name,
    code: workspace.code,
    team_jira_site_host: jiraSiteHostname(siteUrl),
    team_jira_connected: WorkspaceModel.isJiraConnected(workspace),
  }
}

module.exports = {
  jiraSiteHostname,
  developerJiraContext,
  publicWorkspaceLookup,
  sitesMismatch,
  normalizeSiteUrl,
}
