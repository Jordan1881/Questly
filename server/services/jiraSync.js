const config = require('../config')
const jiraClient = require('./jiraClient')
const { ensureWorkspaceDeveloperJiraIds } = require('./jiraAssignee')
const TaskModel = require('../models/task')
const TaskAssignmentModel = require('../models/taskAssignment')
const UserModel = require('../models/user')

async function buildWorkspaceJiraOverrides(workspace, overrides = {}) {
  const merged = { ...overrides }

  if (workspace.jira_site_url) {
    merged.siteUrl = workspace.jira_site_url
  }
  if (workspace.jira_project_key) {
    merged.projectKey = workspace.jira_project_key
  }
  if (workspace.jira_access_token) {
    merged.apiToken = workspace.jira_access_token
    const admin = await UserModel.findByIdInternal(workspace.admin_id)
    if (admin?.email) {
      merged.email = admin.email
    }
  }

  return merged
}

async function syncWorkspaceTasks(workspace, overrides = {}) {
  const jiraOverrides = await buildWorkspaceJiraOverrides(workspace, overrides)
  const projectKey = workspace.jira_project_key || config.jira.projectKey
  const issues = await jiraClient.fetchProjectIssues({
    ...jiraOverrides,
    projectKey,
    siteUrl: workspace.jira_site_url || jiraOverrides.siteUrl,
  })

  let developers = await UserModel.listDevelopersByWorkspace(workspace.id)
  if (developers.length > 0) {
    developers = await ensureWorkspaceDeveloperJiraIds(developers, jiraOverrides)
  }
  const developersByJiraId = new Map(
    developers.filter((dev) => dev.jira_account_id).map((dev) => [dev.jira_account_id, dev]),
  )

  let created = 0
  let updated = 0
  let assignments = 0

  for (const issue of issues) {
    const result = await TaskModel.upsertByJiraIssue({
      workspace_id: workspace.id,
      jira_issue_id: issue.jiraIssueId,
      jira_issue_key: issue.jiraIssueKey,
      title: issue.title,
      description: issue.description,
      difficulty: issue.difficulty,
      xp_reward: issue.xpReward,
      due_date: issue.dueDate,
      high_priority: issue.highPriority,
      status: issue.status,
    })

    if (result.created) created += 1
    else updated += 1

    const assignees = resolveAssignees(issue.assigneeAccountId, developers, developersByJiraId)
    for (const dev of assignees) {
      await TaskAssignmentModel.ensure(result.task.id, dev.id)
      assignments += 1
    }
  }

  return {
    synced: issues.length,
    created,
    updated,
    assignments,
  }
}

function resolveAssignees(assigneeAccountId, developers, developersByJiraId) {
  if (assigneeAccountId) {
    const matched = developersByJiraId.get(assigneeAccountId)
    return matched ? [matched] : []
  }

  // Unassigned Jira issues are visible to all workspace developers.
  return developers
}

module.exports = {
  syncWorkspaceTasks,
}
