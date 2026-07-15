import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../../stores/authStore'

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message, status = 0) {
      super(message)
      this.status = status
    }
  },
}))

import { apiFetch } from '../../lib/api'

describe('authStore membership fetchMe', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'u1', workspace_id: 'ws-1', role: 'admin' },
      token: 'tok',
      userRole: 'admin',
      memberships: [
        { workspace_id: 'ws-1', role: 'admin', is_owner: true },
        { workspace_id: 'ws-2', role: 'developer', is_owner: false },
      ],
      activeWorkspaceId: 'ws-2',
      activeMembership: { workspace_id: 'ws-2', role: 'developer', is_owner: false },
      isLoggedIn: true,
    })
    apiFetch.mockReset()
  })

  it('keeps client-selected workspace if /me returns a different active id', async () => {
    apiFetch.mockResolvedValue({
      user: {
        id: 'u1',
        workspace_id: 'ws-1',
        role: 'developer',
        lifetime_xp: 10,
        coin_balance: 1,
        current_sprint_xp: 0,
      },
      memberships: [
        { workspace_id: 'ws-1', role: 'admin', is_owner: true },
        { workspace_id: 'ws-2', role: 'developer', is_owner: false },
      ],
      active_workspace_id: 'ws-1',
      active_membership: { workspace_id: 'ws-1', role: 'admin', is_owner: true },
    })

    await useAuthStore.getState().fetchMe()

    const state = useAuthStore.getState()
    expect(state.activeWorkspaceId).toBe('ws-2')
    expect(state.activeMembership.role).toBe('developer')
    expect(state.userRole).toBe('developer')
    expect(state.user.workspace_id).toBe('ws-2')
  })

  it('applyMembershipPayload keeps the selected workspace over server active id', () => {
    useAuthStore.getState().applyMembershipPayload({
      memberships: [
        { workspace_id: 'ws-1', role: 'admin', is_owner: true },
        { workspace_id: 'ws-2', role: 'developer', is_owner: false },
      ],
      active_workspace_id: 'ws-1',
      active_membership: { workspace_id: 'ws-1', role: 'admin', is_owner: true },
    })

    const state = useAuthStore.getState()
    expect(state.activeWorkspaceId).toBe('ws-2')
    expect(state.userRole).toBe('developer')
  })

  it('setActiveWorkspace is a no-op write when already active', () => {
    const before = useAuthStore.getState().user
    const path = useAuthStore.getState().setActiveWorkspace('ws-2')
    expect(path).toBe('/w/ws-2/dashboard')
    expect(useAuthStore.getState().user).toBe(before)
  })
})
