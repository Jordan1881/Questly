/**
 * apiFetch — authenticated wrapper around fetch.
 *
 * Automatically attaches the JWT from authStore as a Bearer token.
 * All store API calls should use this instead of raw fetch.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function apiFetch(path, options = {}) {
  const { useAuthStore } = await import('../stores/authStore')
  const { token, logout } = useAuthStore.getState()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    logout()
    throw new Error('Session expired — please sign in again')
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = await res.json()
      message = body.error ?? body.message ?? message
    } catch {
      // non-JSON error body — keep the status message
    }
    throw new Error(message)
  }

  if (res.status === 204) return null

  return res.json()
}
