import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ApiError,
  resolveErrorMessage,
  apiFetch,
  setApiErrorHandler,
  notifyApiError,
} from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'

describe('resolveErrorMessage', () => {
  it('prefers body error message', () => {
    expect(resolveErrorMessage(400, { error: 'username is already taken' }))
      .toBe('username is already taken')
  })

  it('falls back to status-specific defaults', () => {
    expect(resolveErrorMessage(403, null)).toBe('You do not have permission to do that')
    expect(resolveErrorMessage(404, {})).toBe('Not found')
    expect(resolveErrorMessage(500, null)).toBe('Something went wrong on our end')
  })

  it('uses generic message for unknown status codes', () => {
    expect(resolveErrorMessage(418, null)).toBe('Request failed: 418')
  })
})

describe('notifyApiError', () => {
  it('invokes the registered handler for ApiError instances', () => {
    const handler = vi.fn()
    setApiErrorHandler(handler)
    const error = new ApiError('Not found', 404)
    notifyApiError(error)
    expect(handler).toHaveBeenCalledWith(error)
    setApiErrorHandler(null)
  })

  it('ignores non-ApiError values', () => {
    const handler = vi.fn()
    setApiErrorHandler(handler)
    notifyApiError(new Error('plain'))
    expect(handler).not.toHaveBeenCalled()
    setApiErrorHandler(null)
  })
})

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    setApiErrorHandler(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setApiErrorHandler(null)
  })

  it('throws ApiError with mapped message on 400', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid input' }),
    })

    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      message: 'Invalid input',
      status: 400,
      name: 'ApiError',
    })
  })

  it('throws ApiError with default message when body is empty', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => {
        throw new Error('not json')
      },
    })

    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      message: 'You do not have permission to do that',
      status: 403,
    })
  })

  it('logs out with sessionExpired and throws ApiError on 401', async () => {
    useAuthStore.setState({ token: 'bad-token', isLoggedIn: true, user: { id: 'u1' } })

    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    })

    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      message: 'Session expired — please sign in again',
      status: 401,
    })
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(useAuthStore.getState().sessionExpired).toBe(true)
  })

  it('throws network-friendly ApiError when fetch rejects', async () => {
    fetch.mockRejectedValue(new Error('offline'))

    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      message: 'Network error — check your connection and try again',
      status: 0,
    })
  })
})
