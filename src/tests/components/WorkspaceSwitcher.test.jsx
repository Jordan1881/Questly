import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import WorkspaceSwitcher from '../../components/WorkspaceSwitcher'

const navigate = vi.fn()
const setActiveWorkspace = vi.fn(() => '/w/ws-2/dashboard')
const fetchMe = vi.fn(async () => null)

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector) =>
    selector({
      memberships: [
        {
          workspace_id: 'ws-1',
          role: 'admin',
          is_owner: true,
          last_used_at: '2026-01-02T00:00:00Z',
          workspace: {
            name: 'Alpha',
            jira_project_key: 'ALP',
            team_jira_site_host: null,
            team_jira_connected: true,
          },
        },
        {
          workspace_id: 'ws-2',
          role: 'developer',
          is_owner: false,
          last_used_at: null,
          workspace: {
            name: 'Beta',
            jira_project_key: null,
            team_jira_site_host: null,
            team_jira_connected: false,
          },
        },
      ],
      activeWorkspaceId: 'ws-1',
      setActiveWorkspace,
      fetchMe,
    }),
}))

describe('WorkspaceSwitcher', () => {
  beforeEach(() => {
    navigate.mockClear()
    setActiveWorkspace.mockClear()
    fetchMe.mockClear()
  })

  it('shows the active workspace and membership identity in the menu', () => {
    render(
      <MemoryRouter>
        <WorkspaceSwitcher />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: /Alpha/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Alpha/i }))

    expect(screen.getByRole('option', { name: /Alpha/i })).toBeInTheDocument()
    expect(screen.getByText('ALP')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Not connected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create workspace/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Join workspace/i })).toBeInTheDocument()
  })

  it('switches workspace and navigates to role home', async () => {
    render(
      <MemoryRouter>
        <WorkspaceSwitcher />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Alpha/i }))
    fireEvent.click(screen.getByRole('option', { name: /Beta/i }))

    expect(setActiveWorkspace).toHaveBeenCalledWith('ws-2')
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/w/ws-2/dashboard')
    })
  })
})
