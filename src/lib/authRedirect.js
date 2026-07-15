import { apiFetch } from './api'
import { useAuthStore } from '../stores/authStore'
import { isMultiWorkspaceMode, roleHomePath } from './workspaceNav'

export async function resolvePostAuthPath() {
  const { token, userRole, fetchMe } = useAuthStore.getState()
  if (!token) return '/login'

  const user = await fetchMe()
  const state = useAuthStore.getState()

  if (isMultiWorkspaceMode(state)) {
    const list = state.memberships || []
    if (!list.length) {
      // Hub owns first-time create/join. Avoid /workspace/create — that route
      // immediately bounces multi-workspace users back to /workspace.
      try {
        const pending = await apiFetch('/api/join-requests/me')
        if (pending?.join_request) return '/workspace/join'
      } catch {
        // fall through
      }
      return '/workspace'
    }

    const workspaceId = state.activeWorkspaceId || list[0].workspace_id
    const membership =
      state.activeMembership ||
      list.find((m) => m.workspace_id === workspaceId) ||
      list[0]
    useAuthStore.getState().setActiveWorkspace(workspaceId)
    return roleHomePath(membership.role, workspaceId)
  }

  if (userRole === 'admin' || user?.role === 'admin' || state.userRole === 'admin') {
    try {
      const mine = await apiFetch('/api/workspaces/mine')
      return mine?.workspace ? '/admin' : '/workspace/create'
    } catch {
      return '/workspace/create'
    }
  }

  if (user?.workspace_id) return '/dashboard'

  try {
    const pending = await apiFetch('/api/join-requests/me')
    if (pending?.join_request) return '/workspace/join'
  } catch {
    // fall through to join flow
  }

  return '/workspace/join'
}
