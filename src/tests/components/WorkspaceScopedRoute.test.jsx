import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import WorkspaceScopedRoute from '../../components/WorkspaceScopedRoute'
import { useAuthStore } from '../../stores/authStore'

function LocationDisplay() {
  const { pathname } = useLocation()
  return <div data-testid="loc">{pathname}</div>
}

function renderScoped(initialPath = '/w/ws-1/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationDisplay />
      <Routes>
        <Route
          path="/w/:workspaceId/dashboard"
          element={
            <WorkspaceScopedRoute>
              <div>scoped content</div>
            </WorkspaceScopedRoute>
          }
        />
        <Route path="/w/:workspaceId/admin" element={<div>admin home</div>} />
        <Route path="/workspace/join" element={<div>join page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('WorkspaceScopedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      memberships: undefined,
      activeWorkspaceId: null,
      setActiveWorkspace: vi.fn(),
    })
  })

  it('renders children when multi-workspace is off (memberships not an array)', () => {
    useAuthStore.setState({ memberships: undefined })
    renderScoped()
    expect(screen.getByText('scoped content')).toBeInTheDocument()
  })

  it('renders children and syncs the active workspace when membership is valid', () => {
    const setActiveWorkspace = vi.fn()
    useAuthStore.setState({
      memberships: [{ workspace_id: 'ws-1', role: 'developer' }],
      activeWorkspaceId: 'ws-2',
      setActiveWorkspace,
    })
    renderScoped('/w/ws-1/dashboard')
    expect(screen.getByText('scoped content')).toBeInTheDocument()
    expect(setActiveWorkspace).toHaveBeenCalledWith('ws-1')
  })

  it('does not re-sync when the URL workspace is already active', () => {
    const setActiveWorkspace = vi.fn()
    useAuthStore.setState({
      memberships: [{ workspace_id: 'ws-1', role: 'developer' }],
      activeWorkspaceId: 'ws-1',
      setActiveWorkspace,
    })
    renderScoped('/w/ws-1/dashboard')
    expect(screen.getByText('scoped content')).toBeInTheDocument()
    expect(setActiveWorkspace).not.toHaveBeenCalled()
  })

  it('redirects to the active workspace home when the URL membership is missing', () => {
    useAuthStore.setState({
      memberships: [{ workspace_id: 'ws-2', role: 'admin' }],
      activeWorkspaceId: 'ws-2',
      setActiveWorkspace: vi.fn(),
    })
    renderScoped('/w/ws-1/dashboard')
    expect(screen.getByText('admin home')).toBeInTheDocument()
    expect(screen.getByTestId('loc')).toHaveTextContent('/w/ws-2/admin')
  })

  it('falls back to the first membership when there is no active workspace', () => {
    useAuthStore.setState({
      memberships: [{ workspace_id: 'ws-3', role: 'developer' }],
      activeWorkspaceId: null,
      setActiveWorkspace: vi.fn(),
    })
    renderScoped('/w/ws-1/dashboard')
    expect(screen.getByTestId('loc')).toHaveTextContent('/w/ws-3/dashboard')
    expect(screen.getByText('scoped content')).toBeInTheDocument()
  })

  it('redirects to workspace join when there are no memberships to fall back on', () => {
    useAuthStore.setState({
      memberships: [],
      activeWorkspaceId: null,
      setActiveWorkspace: vi.fn(),
    })
    renderScoped('/w/ws-1/dashboard')
    expect(screen.getByText('join page')).toBeInTheDocument()
    expect(screen.getByTestId('loc')).toHaveTextContent('/workspace/join')
  })
})
