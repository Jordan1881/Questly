import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Workspace from '../../pages/Workspace'

const createWorkspace = vi.fn(async (name) => ({
  id: 'ws-new',
  name,
  code: 'ABC123',
}))
const fetchMine = vi.fn(async () => ({
  id: 'ws-1',
  name: 'questly',
  code: 'QUEST1',
  jira_project_key: 'SCRUM',
}))
const fetchMyJoinRequest = vi.fn(async () => null)
const clearError = vi.fn()

let authState = {
  memberships: [
    {
      workspace_id: 'ws-1',
      role: 'admin',
      is_owner: true,
      workspace: { name: 'questly', jira_project_key: 'SCRUM' },
    },
  ],
  activeWorkspaceId: 'ws-1',
  activeMembership: {
    workspace_id: 'ws-1',
    role: 'admin',
    is_owner: true,
    workspace: { name: 'questly', jira_project_key: 'SCRUM' },
  },
  userRole: 'admin',
  user: { username: 'Admin' },
  setActiveWorkspace: vi.fn(),
  fetchMe: vi.fn(async () => null),
}

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector) => selector(authState),
}))

vi.mock('../../stores/workspaceStore', () => ({
  useWorkspaceStore: () => ({
    workspace: { id: 'ws-1', name: 'questly', code: 'QUEST1', jira_project_key: 'SCRUM' },
    fetchMine,
    createWorkspace,
    lookupByCode: vi.fn(),
    submitJoinRequest: vi.fn(),
    fetchMyJoinRequest,
    joinRequest: null,
    isLoading: false,
    error: null,
    clearError,
  }),
}))

vi.mock('../../components/Sidebar', () => ({ default: () => null }))
vi.mock('../../components/PageHeader', () => ({ default: () => null }))

describe('Workspace hub page', () => {
  beforeEach(() => {
    createWorkspace.mockClear()
    fetchMine.mockClear()
    authState.userRole = 'admin'
    authState.activeMembership = {
      workspace_id: 'ws-1',
      role: 'admin',
      is_owner: true,
      workspace: { name: 'questly', jira_project_key: 'SCRUM' },
    }
  })

  it('lets an admin create another workspace', async () => {
    render(
      <MemoryRouter>
        <Workspace />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Create another workspace/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Join another workspace/i })).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Acme Engineering/i), {
      target: { value: 'Second Team' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Create workspace$/i }))

    await waitFor(() => {
      expect(createWorkspace).toHaveBeenCalledWith('Second Team')
    })
    expect(await screen.findByRole('button', { name: /Open as admin/i })).toBeInTheDocument()
    expect(screen.getAllByTestId('workspace-invite-code').length).toBeGreaterThanOrEqual(2)
  })

  it('lets developers join another workspace but not create one', async () => {
    authState.userRole = 'developer'
    authState.activeMembership = {
      workspace_id: 'ws-1',
      role: 'developer',
      is_owner: false,
      workspace: { name: 'questly', jira_project_key: 'SCRUM' },
    }
    authState.memberships = [authState.activeMembership]
    authState.activeWorkspaceId = 'ws-1'

    render(
      <MemoryRouter>
        <Workspace />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Your role: Developer/i)).toBeInTheDocument()
    expect(screen.getByTestId('workspace-switch-list')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Join another workspace/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Create another workspace/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Create workspace$/i })).not.toBeInTheDocument()
    expect(fetchMine).not.toHaveBeenCalled()
  })
})
