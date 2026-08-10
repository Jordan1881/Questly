import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ApiError,
  resolveErrorMessage,
  apiFetch,
  apiUrl,
  warmupApi,
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

describe('warmupApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('pings /api/health/ready without blocking on failure', async () => {
    fetch.mockRejectedValueOnce(new Error('offline'))
    await expect(warmupApi()).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      apiUrl('/api/health/ready'),
      expect.objectContaining({ method: 'GET', cache: 'no-store', keepalive: true }),
    )
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

  it('throws ApiError without logging out when skipSessionExpiry is set on 401', async () => {
    useAuthStore.setState({ token: null, isLoggedIn: false, sessionExpired: false })

    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid credentials' }),
    })

    await expect(
      apiFetch('/api/auth/login', { method: 'POST', skipSessionExpiry: true }),
    ).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
    })
    expect(useAuthStore.getState().sessionExpired).toBe(false)
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
  })

  it('logs out with sessionExpired and throws ApiError on 401', async () => {
    useAuthStore.setState({ token: 'bad-token', isLoggedIn: true, user: { id: 'u1' } })

    fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
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

  it('sends X-Workspace-Id when multi-workspace context is active', async () => {
    useAuthStore.setState({
      token: 'tok',
      memberships: [{ workspace_id: 'ws-42' }],
      activeWorkspaceId: 'ws-42',
    })
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })

    await apiFetch('/api/tasks')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tasks'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer tok',
          'X-Workspace-Id': 'ws-42',
        }),
      }),
    )
  })
})
