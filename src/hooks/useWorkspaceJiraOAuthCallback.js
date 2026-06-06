import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useWorkspaceStore } from '../stores/workspaceStore'

const ERROR_MESSAGES = {
  denied: 'Jira connection was cancelled.',
  wrong_account: 'Use the same Atlassian account email as your Questly admin account.',
  site_not_granted: 'Grant access to your team Jira site during authorization.',
  invalid_state: 'Jira connection expired — please try again.',
  exchange_failed: 'Could not complete Jira connection. Try again.',
  not_configured: 'Jira OAuth is not configured on this server.',
  invalid_workspace: 'Workspace not found for this Jira connection.',
}

export function useWorkspaceJiraOAuthCallback() {
  const location = useLocation()
  const navigate = useNavigate()
  const fetchMine = useWorkspaceStore((s) => s.fetchMine)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const status = params.get('workspace_jira_oauth')
    if (!status) return

    const reason = params.get('workspace_jira_oauth_reason')
    params.delete('workspace_jira_oauth')
    params.delete('workspace_jira_oauth_reason')
    params.delete('workspace_jira_oauth_detail')

    const nextSearch = params.toString()
    navigate(
      { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' },
      { replace: true },
    )

    if (status === 'success') {
      fetchMine().catch(() => {})
      useWorkspaceStore.setState({ error: null })
      return
    }

    const message = ERROR_MESSAGES[reason] || 'Failed to connect workspace Jira.'
    useWorkspaceStore.setState({ error: message })
  }, [location.pathname, location.search, navigate, fetchMine])
}
