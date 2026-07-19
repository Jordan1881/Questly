import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWorkspaceJiraOAuthCallback } from '../../hooks/useWorkspaceJiraOAuthCallback'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useToastStore } from '../../stores/toastStore'

let mockLocation
const mockNavigate = vi.fn()

vi.mock('react-router', () => ({
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
}))

function setLocation(search, pathname = '/admin/jira') {
  mockLocation = { pathname, search }
}

describe('useWorkspaceJiraOAuthCallback', () => {
  let fetchMine
  let showSuccess

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMine = vi.fn().mockResolvedValue(undefined)
    showSuccess = vi.fn()
    useWorkspaceStore.setState({ fetchMine, error: null })
    useToastStore.setState({ showSuccess })
    setLocation('')
  })

  it('does nothing when the workspace_jira_oauth param is absent', () => {
    setLocation('?foo=bar')
    renderHook(() => useWorkspaceJiraOAuthCallback())

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(fetchMine).not.toHaveBeenCalled()
  })

  it('handles success by refetching, clearing error, and toasting', () => {
    setLocation(
      '?workspace_jira_oauth=success&keep=1&workspace_jira_oauth_reason=r&workspace_jira_oauth_detail=d',
    )
    renderHook(() => useWorkspaceJiraOAuthCallback())

    expect(mockNavigate).toHaveBeenCalledWith(
      { pathname: '/admin/jira', search: '?keep=1' },
      { replace: true },
    )
    expect(fetchMine).toHaveBeenCalledTimes(1)
    expect(useWorkspaceStore.getState().error).toBeNull()
    expect(showSuccess).toHaveBeenCalledWith('Jira connection updated.')
  })

  it('swallows fetchMine rejections on success', async () => {
    fetchMine = vi.fn().mockRejectedValue(new Error('boom'))
    useWorkspaceStore.setState({ fetchMine })
    setLocation('?workspace_jira_oauth=success')

    expect(() => renderHook(() => useWorkspaceJiraOAuthCallback())).not.toThrow()
    // allow the rejected promise's .catch to settle
    await Promise.resolve()
    expect(fetchMine).toHaveBeenCalledTimes(1)
  })

  it('leaves an empty search string when no other params remain', () => {
    setLocation('?workspace_jira_oauth=success')
    renderHook(() => useWorkspaceJiraOAuthCallback())

    expect(mockNavigate).toHaveBeenCalledWith(
      { pathname: '/admin/jira', search: '' },
      { replace: true },
    )
  })

  it('handles pending by clearing error and showing a toast', () => {
    setLocation('?workspace_jira_oauth=pending')
    renderHook(() => useWorkspaceJiraOAuthCallback())

    expect(useWorkspaceStore.getState().error).toBeNull()
    expect(showSuccess).toHaveBeenCalledWith(
      'Atlassian account linked. Confirm your Jira site below.',
    )
    expect(fetchMine).not.toHaveBeenCalled()
  })

  it('maps a known error reason to its message', () => {
    setLocation('?workspace_jira_oauth=error&workspace_jira_oauth_reason=invalid_workspace')
    renderHook(() => useWorkspaceJiraOAuthCallback())

    expect(useWorkspaceStore.getState().error).toBe(
      'Workspace not found for this Jira connection.',
    )
  })

  it('falls back to a generic message for unknown error reasons', () => {
    setLocation('?workspace_jira_oauth=error&workspace_jira_oauth_reason=nope')
    renderHook(() => useWorkspaceJiraOAuthCallback())

    expect(useWorkspaceStore.getState().error).toBe('Failed to connect workspace Jira.')
  })
})
