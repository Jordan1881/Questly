import { beforeEach, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import MultiWorkspaceRedirect from '../../components/MultiWorkspaceRedirect'
import { useAuthStore } from '../../stores/authStore'

function LocationDisplay() {
  const { pathname } = useLocation()
  return <div data-testid="loc">{pathname}</div>
}

function Wrapper() {
  return (
    <MultiWorkspaceRedirect pageId="dashboard">
      <div>flat page</div>
    </MultiWorkspaceRedirect>
  )
}

function renderAt(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationDisplay />
      <Routes>
        <Route path="/dashboard" element={<Wrapper />} />
        <Route path="/w/ws-1/dashboard" element={<Wrapper />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MultiWorkspaceRedirect', () => {
  beforeEach(() => {
    useAuthStore.setState({ memberships: undefined, activeWorkspaceId: null })
  })

  it('renders children when memberships are not an array (flag off)', () => {
    useAuthStore.setState({ memberships: undefined, activeWorkspaceId: 'ws-1' })
    renderAt('/dashboard')
    expect(screen.getByText('flat page')).toBeInTheDocument()
    expect(screen.getByTestId('loc')).toHaveTextContent('/dashboard')
  })

  it('renders children when there is no active workspace', () => {
    useAuthStore.setState({ memberships: [{ workspace_id: 'ws-1' }], activeWorkspaceId: null })
    renderAt('/dashboard')
    expect(screen.getByText('flat page')).toBeInTheDocument()
    expect(screen.getByTestId('loc')).toHaveTextContent('/dashboard')
  })

  it('redirects flat routes to the scoped path when multi-workspace is active', () => {
    useAuthStore.setState({ memberships: [{ workspace_id: 'ws-1' }], activeWorkspaceId: 'ws-1' })
    renderAt('/dashboard')
    expect(screen.getByTestId('loc')).toHaveTextContent('/w/ws-1/dashboard')
  })

  it('does not redirect when already on a scoped /w/ path', () => {
    useAuthStore.setState({ memberships: [{ workspace_id: 'ws-1' }], activeWorkspaceId: 'ws-1' })
    renderAt('/w/ws-1/dashboard')
    expect(screen.getByText('flat page')).toBeInTheDocument()
    expect(screen.getByTestId('loc')).toHaveTextContent('/w/ws-1/dashboard')
  })
})
