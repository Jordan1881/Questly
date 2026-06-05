const db = require('../config/db')
const config = require('../config')
const jiraClient = require('./jiraClient')
const TaskModel = require('../models/task')
const TaskAssignmentModel = require('../models/taskAssignment')
const UserModel = require('../models/user')

async function syncWorkspaceTasks(workspace, overrides = {}) {
  const projectKey = workspace.jira_project_key || config.jira.projectKey
  const issues = await jiraClient.fetchProjectIssues({
    ...overrides,
    projectKey,
    siteUrl: workspace.jira_site_url || overrides.siteUrl,
  })

  const developers = await UserModel.listDevelopersByWorkspace(workspace.id)
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
