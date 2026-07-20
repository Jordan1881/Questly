import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Sidebar from '../../components/Sidebar'

const mockNavigate = vi.fn()

vi.mock('react-router', async (importActual) => {
  const actual = await importActual()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../design-system/motion', () => ({
  gsap: { set: vi.fn(), to: vi.fn() },
  registerGsap: vi.fn(),
  MOTION: { duration: { fast: 0.2 }, ease: { standard: 'power2.out' } },
  prefersReducedMotion: () => true,
}))

const authState = {
  userRole: 'developer',
  logout: vi.fn(),
  user: { workspace_id: null, lifetime_xp: 0 },
  memberships: undefined,
  activeWorkspaceId: null,
  activeMembership: null,
}

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector) => selector(authState),
}))

function renderSidebar(props = {}, { initialEntries = ['/dashboard'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Sidebar isOpen onClose={vi.fn()} {...props} />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.userRole = 'developer'
    authState.logout = vi.fn().mockResolvedValue(undefined)
    authState.user = { workspace_id: null, lifetime_xp: 0 }
    authState.memberships = undefined
    authState.activeWorkspaceId = null
    authState.activeMembership = null
  })

  it('shows the join-workspace link for a developer without a workspace', () => {
    renderSidebar()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('Reward Shop')).toBeInTheDocument()
    expect(screen.getByText('Join Workspace')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    // Developers see the level widget.
    expect(screen.getByText('Your Level')).toBeInTheDocument()
  })

  it('hides the join-workspace link when the developer has a workspace', () => {
    authState.user = { workspace_id: 'ws-1', lifetime_xp: 0 }
    renderSidebar()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Join Workspace')).not.toBeInTheDocument()
  })

  it('renders the admin navigation without the level widget', () => {
    authState.userRole = 'admin'
    renderSidebar({}, { initialEntries: ['/admin'] })

    expect(screen.getByText('Workspace')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.queryByText('Your Level')).not.toBeInTheDocument()
  })

  it('renders the multi-workspace developer navigation', () => {
    authState.memberships = []
    authState.activeWorkspaceId = 'ws-9'
    renderSidebar({}, { initialEntries: ['/w/ws-9/dashboard'] })

    expect(screen.getByText('Workspace')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
  })

  it('renders admin navigation in multi-workspace mode via active membership role', () => {
    authState.memberships = []
    authState.activeMembership = { role: 'admin' }
    authState.activeWorkspaceId = 'ws-9'
    renderSidebar({}, { initialEntries: ['/w/ws-9/admin'] })

    expect(screen.getByText('Admin')).toBeInTheDocument()
    // userRole is still developer, so the level widget remains.
    expect(screen.getByText('Your Level')).toBeInTheDocument()
  })

  it('navigates to a flat path and closes on nav click', () => {
    const onClose = vi.fn()
    renderSidebar({ onClose })

    fireEvent.click(screen.getByText('Tasks'))

    expect(mockNavigate).toHaveBeenCalledWith('/tasks')
    expect(onClose).toHaveBeenCalled()
  })

  it('navigates to a workspace-scoped path in multi mode', () => {
    authState.memberships = []
    authState.activeWorkspaceId = 'ws-9'
    renderSidebar({}, { initialEntries: ['/w/ws-9/dashboard'] })

    fireEvent.click(screen.getByText('Tasks'))

    expect(mockNavigate).toHaveBeenCalledWith('/w/ws-9/tasks')
  })

  it('marks the current route as active', () => {
    renderSidebar({}, { initialEntries: ['/dashboard'] })

    const dashboardButton = screen.getByText('Dashboard').closest('button')
    expect(dashboardButton.className).toContain('ds-nav-item--active')
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    renderSidebar({ onClose })

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('logs out and navigates home', async () => {
    const onClose = vi.fn()
    renderSidebar({ onClose })

    fireEvent.click(screen.getByText('Log Out'))

    await waitFor(() => {
      expect(authState.logout).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('renders without an active item on an unmatched route', () => {
    renderSidebar({}, { initialEntries: ['/totally-unknown-route'] })

    const dashboardButton = screen.getByText('Dashboard').closest('button')
    expect(dashboardButton.className).not.toContain('ds-nav-item--active')
  })

  it('reflects the level derived from lifetime XP', () => {
    authState.user = { workspace_id: 'ws-1', lifetime_xp: 1500 }
    renderSidebar()

    expect(screen.getByText('Level 2')).toBeInTheDocument()
  })
})
