const jiraClient = require('./jiraClient')
const UserModel = require('../models/user')
const { configuredDeveloperShortcuts } = require('../lib/jiraConfig')

async function resolveJiraAccountIdForUser(user, overrides = {}) {
  if (!user?.email || user.jira_account_id) {
    return user?.jira_account_id || null
  }

  const { developerEmail, developerAccountId } = configuredDeveloperShortcuts()

  if (
    developerEmail &&
    developerAccountId &&
    user.email.toLowerCase() === developerEmail.toLowerCase()
  ) {
    return developerAccountId
  }

  return jiraClient.lookupAccountIdByEmail(user.email, overrides)
}

async function ensureDeveloperJiraAccountId(user, overrides = {}) {
  if (!user || user.role !== 'developer' || user.jira_account_id) {
    return user?.jira_account_id || null
  }

  const jiraAccountId = await resolveJiraAccountIdForUser(user, overrides)
  if (!jiraAccountId) return null

  await UserModel.updateJiraAccountId(user.id, jiraAccountId)
  return jiraAccountId
}

async function ensureWorkspaceDeveloperJiraIds(developers, overrides = {}) {
  for (const developer of developers) {
    await ensureDeveloperJiraAccountId(developer, overrides)
  }

  return UserModel.listDevelopersByWorkspace(developers[0]?.workspace_id)
}

module.exports = {
  resolveJiraAccountIdForUser,
  ensureDeveloperJiraAccountId,
  ensureWorkspaceDeveloperJiraIds,
}
