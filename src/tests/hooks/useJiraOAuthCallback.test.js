import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useJiraOAuthCallback } from '../../hooks/useJiraOAuthCallback'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'

let mockLocation
const mockNavigate = vi.fn()

vi.mock('react-router', () => ({
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
}))

function setLocation(search, pathname = '/settings') {
  mockLocation = { pathname, search }
}

describe('useJiraOAuthCallback', () => {
  let fetchMe
  let showSuccess

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMe = vi.fn()
    showSuccess = vi.fn()
    useAuthStore.setState({ fetchMe, error: null })
    useToastStore.setState({ showSuccess })
    setLocation('')
  })

  it('does nothing when the jira_oauth param is absent', () => {
    setLocation('?foo=bar')
    renderHook(() => useJiraOAuthCallback())

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(fetchMe).not.toHaveBeenCalled()
  })

  it('handles success by refetching the user and stripping oauth params', () => {
    setLocation('?jira_oauth=success&foo=bar&jira_oauth_reason=x&jira_oauth_detail=y')
    renderHook(() => useJiraOAuthCallback())

    expect(mockNavigate).toHaveBeenCalledWith(
      { pathname: '/settings', search: '?foo=bar' },
      { replace: true },
    )
    expect(fetchMe).toHaveBeenCalledTimes(1)
  })

  it('leaves an empty search string when no other params remain', () => {
    setLocation('?jira_oauth=success')
    renderHook(() => useJiraOAuthCallback())

    expect(mockNavigate).toHaveBeenCalledWith(
      { pathname: '/settings', search: '' },
      { replace: true },
    )
  })

  it('handles pending by clearing error and showing a toast', () => {
    setLocation('?jira_oauth=pending')
    renderHook(() => useJiraOAuthCallback())

    expect(useAuthStore.getState().error).toBeNull()
    expect(showSuccess).toHaveBeenCalledWith(
      'Atlassian account linked. Confirm your Jira site below.',
    )
    expect(fetchMe).not.toHaveBeenCalled()
  })

  it('maps a known error reason to its message', () => {
    setLocation('?jira_oauth=error&jira_oauth_reason=denied')
    renderHook(() => useJiraOAuthCallback())

    expect(useAuthStore.getState().error).toBe('Jira connection was cancelled.')
    expect(fetchMe).not.toHaveBeenCalled()
  })

  it('falls back to a generic message for unknown error reasons', () => {
    setLocation('?jira_oauth=error&jira_oauth_reason=totally_unknown')
    renderHook(() => useJiraOAuthCallback())

    expect(useAuthStore.getState().error).toBe('Failed to connect Jira.')
  })

  it('falls back to a generic message when no reason is provided', () => {
    setLocation('?jira_oauth=error')
    renderHook(() => useJiraOAuthCallback())

    expect(useAuthStore.getState().error).toBe('Failed to connect Jira.')
  })
})
