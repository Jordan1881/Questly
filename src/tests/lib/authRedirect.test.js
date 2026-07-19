import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/api', () => ({ apiFetch: vi.fn() }))
vi.mock('../../stores/authStore', () => ({ useAuthStore: { getState: vi.fn() } }))

import { apiFetch } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { resolvePostAuthPath } from '../../lib/authRedirect'

function mockState(overrides = {}) {
  const state = {
    token: 'tok',
    userRole: 'developer',
    fetchMe: vi.fn().mockResolvedValue(null),
    memberships: undefined,
    activeWorkspaceId: null,
    activeMembership: null,
    setActiveWorkspace: vi.fn(),
    ...overrides,
  }
  useAuthStore.getState.mockReturnValue(state)
  return state
}

describe('resolvePostAuthPath', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login when there is no token', async () => {
    const state = mockState({ token: null })
    await expect(resolvePostAuthPath()).resolves.toBe('/login')
    expect(state.fetchMe).not.toHaveBeenCalled()
  })

  describe('multi-workspace mode', () => {
    it('routes empty memberships to /workspace/join when a join request is pending', async () => {
      mockState({ memberships: [] })
      apiFetch.mockResolvedValue({ join_request: { id: 'jr-1' } })

      await expect(resolvePostAuthPath()).resolves.toBe('/workspace/join')
      expect(apiFetch).toHaveBeenCalledWith('/api/join-requests/me')
    })

    it('routes empty memberships to /workspace when no join request is pending', async () => {
      mockState({ memberships: [] })
      apiFetch.mockResolvedValue({})

      await expect(resolvePostAuthPath()).resolves.toBe('/workspace')
    })

    it('routes empty memberships to /workspace when the join lookup returns null', async () => {
      mockState({ memberships: [] })
      apiFetch.mockResolvedValue(null)

      await expect(resolvePostAuthPath()).resolves.toBe('/workspace')
    })

    it('routes empty memberships to /workspace when the join lookup throws', async () => {
      mockState({ memberships: [] })
      apiFetch.mockRejectedValue(new Error('offline'))

      await expect(resolvePostAuthPath()).resolves.toBe('/workspace')
    })

    it('uses the active membership + workspace id when present', async () => {
      const state = mockState({
        memberships: [
          { workspace_id: 'ws-1', role: 'developer' },
          { workspace_id: 'ws-2', role: 'admin' },
        ],
        activeWorkspaceId: 'ws-2',
        activeMembership: { workspace_id: 'ws-2', role: 'admin' },
      })

      await expect(resolvePostAuthPath()).resolves.toBe('/w/ws-2/admin')
      expect(state.setActiveWorkspace).toHaveBeenCalledWith('ws-2')
    })

    it('falls back to the first membership when no active context is set', async () => {
      const state = mockState({
        memberships: [{ workspace_id: 'ws-1', role: 'developer' }],
        activeWorkspaceId: null,
        activeMembership: null,
      })

      await expect(resolvePostAuthPath()).resolves.toBe('/w/ws-1/dashboard')
      expect(state.setActiveWorkspace).toHaveBeenCalledWith('ws-1')
    })

    it('falls back to first membership role when active workspace id is not in the list', async () => {
      const state = mockState({
        memberships: [{ workspace_id: 'ws-1', role: 'admin' }],
        activeWorkspaceId: 'ws-999',
        activeMembership: null,
      })

      await expect(resolvePostAuthPath()).resolves.toBe('/w/ws-999/admin')
      expect(state.setActiveWorkspace).toHaveBeenCalledWith('ws-999')
    })
  })

  describe('single-workspace admin', () => {
    it('routes to /admin when the admin already owns a workspace', async () => {
      mockState({ userRole: 'admin' })
      apiFetch.mockResolvedValue({ workspace: { id: 'w1' } })

      await expect(resolvePostAuthPath()).resolves.toBe('/admin')
      expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/mine')
    })

    it('routes to /workspace/create when the admin has no workspace', async () => {
      mockState({ userRole: 'admin' })
      apiFetch.mockResolvedValue({})

      await expect(resolvePostAuthPath()).resolves.toBe('/workspace/create')
    })

    it('routes to /workspace/create when the workspace lookup throws', async () => {
      mockState({ userRole: 'admin' })
      apiFetch.mockRejectedValue(new Error('boom'))

      await expect(resolvePostAuthPath()).resolves.toBe('/workspace/create')
    })

    it('detects admin from the fetched user role', async () => {
      mockState({ userRole: 'developer', fetchMe: vi.fn().mockResolvedValue({ role: 'admin' }) })
      apiFetch.mockResolvedValue({ workspace: { id: 'w1' } })

      await expect(resolvePostAuthPath()).resolves.toBe('/admin')
    })
  })

  describe('single-workspace developer', () => {
    it('routes to /dashboard when the user has a workspace id', async () => {
      mockState({ userRole: 'developer', fetchMe: vi.fn().mockResolvedValue({ workspace_id: 'w1' }) })

      await expect(resolvePostAuthPath()).resolves.toBe('/dashboard')
      expect(apiFetch).not.toHaveBeenCalled()
    })

    it('routes to /workspace/join when a join request is pending', async () => {
      mockState({ userRole: 'developer', fetchMe: vi.fn().mockResolvedValue({}) })
      apiFetch.mockResolvedValue({ join_request: { id: 'jr-1' } })

      await expect(resolvePostAuthPath()).resolves.toBe('/workspace/join')
      expect(apiFetch).toHaveBeenCalledWith('/api/join-requests/me')
    })

    it('routes to /workspace/join when there is no pending join request', async () => {
      mockState({ userRole: 'developer', fetchMe: vi.fn().mockResolvedValue({}) })
      apiFetch.mockResolvedValue(null)

      await expect(resolvePostAuthPath()).resolves.toBe('/workspace/join')
    })

    it('routes to /workspace/join when the join lookup throws', async () => {
      mockState({ userRole: 'developer', fetchMe: vi.fn().mockResolvedValue({}) })
      apiFetch.mockRejectedValue(new Error('offline'))

      await expect(resolvePostAuthPath()).resolves.toBe('/workspace/join')
    })
  })
})
