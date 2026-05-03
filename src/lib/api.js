/**
 * apiFetch — authenticated wrapper around fetch.
 *
 * Automatically attaches the JWT from authStore as a Bearer token.
 * All store API calls should use this instead of raw fetch.
 *
 * Usage:
 *   import { apiFetch } from '../lib/api'
 *   const data = await apiFetch('/api/tasks')
 *   const created = await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(payload) })
 *
 * Throws an Error with the server's message on non-2xx responses.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function apiFetch(path, options = {}) {
  // Import here (not at top) to avoid circular deps — stores import api, api reads authStore
  const { useAuthStore } = await import('../stores/authStore')
  const token = useAuthStore.getState().token

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = await res.json()
      message = body.message ?? message
    } catch {
      // non-JSON error body — keep the status message
    }
    throw new Error(message)
  }

  // 204 No Content — return null instead of trying to parse empty body
  if (res.status === 204) return null

  return res.json()
}
