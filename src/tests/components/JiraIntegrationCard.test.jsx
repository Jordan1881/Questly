import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import JiraIntegrationCard from '../../components/JiraIntegrationCard'
import { useAuthStore } from '../../stores/authStore'

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <JiraIntegrationCard {...props} />
    </MemoryRouter>,
  )
}

describe('JiraIntegrationCard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: 'test-token',
      userRole: 'developer',
      isLoggedIn: true,
      isLoading: false,
      error: null,
      fetchPendingJiraOAuth: vi.fn().mockResolvedValue(null),
      fetchPendingJiraOAuthSites: vi.fn().mockResolvedValue({ sites: [] }),
      fetchJiraOAuthStatus: vi.fn().mockResolvedValue({ available: false }),
      startJiraOAuth: vi.fn(),
      confirmPendingJiraOAuthSite: vi.fn(),
      cancelPendingJiraOAuth: vi.fn(),
      connectJira: vi.fn(),
      disconnectJira: vi.fn(),
    })
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ available: false }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('allows personal connect without a workspace', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'dev@test.com', workspace_id: null, jira_connected: false },
    })

    renderCard()

    expect(screen.getByText('Awaiting team')).toBeInTheDocument()
    expect(screen.getByText(/No team site yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'join a workspace' })).toHaveAttribute('href', '/workspace/join')
  })

  it('shows connect form when developer has workspace but is not connected', async () => {
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'dev@test.com',
        workspace_id: 'ws-1',
        jira_connected: false,
        team_jira_connected: true,
        team_jira_site_host: 'acme.atlassian.net',
      },
      fetchJiraOAuthStatus: vi.fn().mockResolvedValue({ available: true }),
    })
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ available: true }),
    })

    renderCard()

    expect(screen.getByText('Not connected')).toBeInTheDocument()
    expect(screen.getByText(/acme\.atlassian\.net/i)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Connect with Jira/i })).toBeInTheDocument()
  })

  it('shows admin-not-connected message when team Jira is not ready', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'dev@test.com',
        workspace_id: 'ws-1',
        jira_connected: false,
        team_jira_connected: false,
      },
    })

    renderCard()

    expect(screen.getByText(/admin has not connected team Jira yet/i)).toBeInTheDocument()
  })

  it('shows connected state with disconnect when jira_connected is true', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'dev@test.com', workspace_id: 'ws-1', jira_connected: true },
    })

    renderCard()

    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument()
  })
})
