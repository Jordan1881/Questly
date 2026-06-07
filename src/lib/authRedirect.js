import { apiFetch } from './api'
import { useAuthStore } from '../stores/authStore'

export async function resolvePostAuthPath() {
  const { token, userRole, fetchMe } = useAuthStore.getState()
  if (!token) return '/login'

  const user = await fetchMe()

  if (userRole === 'admin' || user?.role === 'admin') {
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
