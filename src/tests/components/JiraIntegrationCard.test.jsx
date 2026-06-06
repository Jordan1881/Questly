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

  it('shows awaiting-team state without connect form when developer has no workspace', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'dev@test.com', workspace_id: null, jira_connected: false },
    })

    renderCard()

    expect(screen.getByText('Awaiting team')).toBeInTheDocument()
    expect(screen.getByText(/Join a team first/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Join a workspace' })).toHaveAttribute('href', '/workspace/join')
    expect(screen.queryByPlaceholderText('Jira API token')).not.toBeInTheDocument()
  })

  it('shows connect form when developer has workspace but is not connected', async () => {
    useAuthStore.setState({
      user: { id: '1', email: 'dev@test.com', workspace_id: 'ws-1', jira_connected: false },
    })

    renderCard()

    expect(screen.getByText('Not connected')).toBeInTheDocument()
    expect(await screen.findByPlaceholderText('Jira API token')).toBeInTheDocument()
    expect(screen.queryByText(/Join a team first/i)).not.toBeInTheDocument()
  })

  it('shows connected state with disconnect when jira_connected is true', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'dev@test.com', workspace_id: 'ws-1', jira_connected: true },
    })

    renderCard()

    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disconnect Jira' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Jira API token')).not.toBeInTheDocument()
  })
})
