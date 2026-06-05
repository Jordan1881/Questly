import { useAuthStore } from '../stores/authStore'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function authedGet(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) return null
  return res.json()
}

export async function resolvePostAuthPath() {
  const { token, userRole, fetchMe } = useAuthStore.getState()
  if (!token) return '/login'

  const user = await fetchMe()

  if (userRole === 'admin' || user?.role === 'admin') {
    const mine = await authedGet('/api/workspaces/mine', token)
    return mine?.workspace ? '/admin' : '/workspace/create'
  }

  if (user?.workspace_id) return '/dashboard'

  const pending = await authedGet('/api/join-requests/me', token)
  if (pending?.join_request) return '/workspace/join'

  return '/workspace/join'
}
