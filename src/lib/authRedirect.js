import { apiFetch } from './api'
import { useAuthStore } from '../stores/authStore'
import { isMultiWorkspaceMode, roleHomePath } from './workspaceNav'

async function pathIfPendingJoin(fallback) {
  try {
    const pending = await apiFetch('/api/join-requests/me')
    if (pending?.join_request) return '/workspace/join'
  } catch {
    // fall through
  }
  return fallback
}

async function resolveMultiWorkspacePath(state) {
  const list = state.memberships || []
  if (!list.length) {
    // Hub owns first-time create/join. Avoid /workspace/create — that route
    // immediately bounces multi-workspace users back to /workspace.
    return pathIfPendingJoin('/workspace')
  }

  const workspaceId = state.activeWorkspaceId || list[0].workspace_id
  const membership =
    state.activeMembership ||
    list.find((m) => m.workspace_id === workspaceId) ||
    list[0]
  useAuthStore.getState().setActiveWorkspace(workspaceId)
  return roleHomePath(membership.role, workspaceId)
}

async function resolveAdminHomePath() {
  try {
    const mine = await apiFetch('/api/workspaces/mine')
    return mine?.workspace ? '/admin' : '/workspace/create'
  } catch {
    return '/workspace/create'
  }
}

function isAdminSession(userRole, user, state) {
  return userRole === 'admin' || user?.role === 'admin' || state.userRole === 'admin'
}

export async function resolvePostAuthPath() {
  const { token, userRole, fetchMe } = useAuthStore.getState()
  if (!token) return '/login'

  const user = await fetchMe()
  const state = useAuthStore.getState()

  if (isMultiWorkspaceMode(state)) {
    return resolveMultiWorkspacePath(state)
  }

  if (isAdminSession(userRole, user, state)) {
    return resolveAdminHomePath()
  }

  if (user?.workspace_id) return '/dashboard'

  return pathIfPendingJoin('/workspace/join')
}
