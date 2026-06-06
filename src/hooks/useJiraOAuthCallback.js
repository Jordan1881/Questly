import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuthStore } from '../stores/authStore'

const ERROR_MESSAGES = {
  denied: 'Jira connection was cancelled.',
  wrong_account: 'Use the same Atlassian account email as your Questly account.',
  site_not_granted: 'Grant access to your workspace Jira site during authorization.',
  invalid_state: 'Jira connection expired — please try again.',
  exchange_failed: 'Could not complete Jira connection. Try again.',
  not_configured: 'Jira OAuth is not configured on this server.',
}

export function useJiraOAuthCallback() {
  const location = useLocation()
  const navigate = useNavigate()
  const fetchMe = useAuthStore((s) => s.fetchMe)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const status = params.get('jira_oauth')
    if (!status) return

    const reason = params.get('jira_oauth_reason')
    params.delete('jira_oauth')
    params.delete('jira_oauth_reason')
    params.delete('jira_oauth_detail')

    const nextSearch = params.toString()
    navigate(
      { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' },
      { replace: true },
    )

    if (status === 'success') {
      fetchMe()
      return
    }

    const message = ERROR_MESSAGES[reason] || 'Failed to connect Jira.'
    useAuthStore.setState({ error: message })
  }, [location.pathname, location.search, navigate, fetchMe])
}
