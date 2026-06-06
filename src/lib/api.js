/**
 * apiFetch — authenticated wrapper around fetch.
 *
 * Automatically attaches the JWT from authStore as a Bearer token.
 * All store API calls should use this instead of raw fetch.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const STATUS_MESSAGES = {
  400: 'Invalid request',
  403: 'You do not have permission to do that',
  404: 'Not found',
  500: 'Something went wrong on our end',
}

export function resolveErrorMessage(status, body) {
  const fromBody = body?.error ?? body?.message
  if (fromBody) return fromBody
  return STATUS_MESSAGES[status] ?? `Request failed: ${status}`
}

let apiErrorHandler = null

/** Register a global handler invoked on every failed apiFetch (except 401 logout). */
export function setApiErrorHandler(handler) {
  apiErrorHandler = handler
}

export function notifyApiError(error) {
  if (apiErrorHandler && error instanceof ApiError) {
    apiErrorHandler(error)
  }
}

export async function apiFetch(path, options = {}) {
  const { useAuthStore } = await import('../stores/authStore')
  const { token, logout } = useAuthStore.getState()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    const networkError = new ApiError(
      'Network error — check your connection and try again',
      0,
    )
    notifyApiError(networkError)
    throw networkError
  }

  if (res.status === 401) {
    logout()
    const sessionError = new ApiError('Session expired — please sign in again', 401)
    notifyApiError(sessionError)
    throw sessionError
  }

  if (!res.ok) {
    let body = null
    try {
      body = await res.json()
    } catch {
      // non-JSON error body
    }
    const error = new ApiError(resolveErrorMessage(res.status, body), res.status)
    notifyApiError(error)
    throw error
  }

  if (res.status === 204) return null

  return res.json()
}
