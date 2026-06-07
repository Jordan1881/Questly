import { Link } from 'react-router'

export default function TeamJiraBanner({ user }) {
  const hasWorkspace = Boolean(user?.workspace_id)
  const jiraConnected = Boolean(user?.jira_connected)
  const teamHost = user?.team_jira_site_host
  const teamJiraReady = Boolean(user?.team_jira_connected)
  const siteUrl = user?.expected_jira_site_url

  if (!hasWorkspace || jiraConnected) return null

  if (!teamJiraReady) {
    return (
      <div className="mb-6 rounded-[10px] border border-[color:var(--color-warning-200)] bg-[color:var(--color-warning-50)] px-4 py-3 text-[length:var(--text-body-sm)] text-[color:var(--color-warning-700)]">
        Your admin has not connected team Jira yet. You will be able to link your Jira account
        after they connect Jira in Admin.
      </div>
    )
  }

  const hostLabel = teamHost || siteUrl || 'your team Jira site'

  return (
    <div className="mb-6 rounded-[10px] border border-[color:var(--color-border-brand)] bg-[color:var(--color-bg-brand-subtle)] px-4 py-3 text-[length:var(--text-body-sm)] text-[color:var(--color-primary-900)]">
      Your team uses <strong>{hostLabel}</strong> —{' '}
      <Link to="/profile" className="font-semibold text-[color:var(--color-brand)] hover:underline">
        connect your Jira account on Profile
      </Link>{' '}
      to receive assigned tasks.
    </div>
  )
}
