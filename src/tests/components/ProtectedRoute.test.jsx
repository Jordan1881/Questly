import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuthStore } from '../../stores/authStore'

vi.mock('../../hooks/useJiraOAuthCallback', () => ({
  useJiraOAuthCallback: () => {},
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'u1', username: 'Admin', role: 'admin', workspace_id: 'ws-1' },
      token: 'tok',
      userRole: 'admin',
      memberships: undefined,
      activeWorkspaceId: null,
      activeMembership: null,
      isLoggedIn: true,
    })
  })

  it('calls fetchMe only once when user object is replaced after /me', async () => {
    const fetchMe = vi.fn(async () => {
      const next = {
        id: 'u1',
        username: 'Admin',
        role: 'admin',
        workspace_id: 'ws-1',
        lifetime_xp: 0,
      }
      useAuthStore.setState({ user: { ...next } })
      return next
    })
    useAuthStore.setState({ fetchMe })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <div>Admin body</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => expect(fetchMe).toHaveBeenCalledTimes(1))
    await new Promise((r) => setTimeout(r, 30))
    expect(fetchMe).toHaveBeenCalledTimes(1)
  })
})
