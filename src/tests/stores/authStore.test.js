import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAuthStore } from '../../stores/authStore'

const RESET = {
  user: null,
  token: null,
  userRole: 'developer',
  isLoggedIn: false,
  isLoading: false,
  error: null,
}

function mockFetch(body, ok = true, status = ok ? 200 : 401) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  })
}

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState(RESET)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Sync helpers ────────────────────────────────────────────────────────────

  it('setUserRole updates userRole', () => {
    useAuthStore.getState().setUserRole('admin')
    expect(useAuthStore.getState().userRole).toBe('admin')
  })

  it('setLoggedIn updates isLoggedIn', () => {
    useAuthStore.getState().setLoggedIn(true)
    expect(useAuthStore.getState().isLoggedIn).toBe(true)
  })

  it('clearError resets error to null', () => {
    useAuthStore.setState({ error: 'something went wrong' })
    useAuthStore.getState().clearError()
    expect(useAuthStore.getState().error).toBeNull()
  })

  // ── login ───────────────────────────────────────────────────────────────────

  it('login calls POST /api/auth/login and stores user + token on success', async () => {
    const fakeUser = { id: '1', email: 'dev@test.com', username: 'dev', role: 'developer' }
    mockFetch({ user: fakeUser, token: 'real-jwt' })

    const result = await useAuthStore.getState().login({ email: 'dev@test.com', password: 'pass' })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(result.ok).toBe(true)
    const { user, token, isLoggedIn, userRole } = useAuthStore.getState()
    expect(user).toEqual(fakeUser)
    expect(token).toBe('real-jwt')
    expect(isLoggedIn).toBe(true)
    expect(userRole).toBe('developer')
  })

  it('login sets error and returns ok:false on server error', async () => {
    mockFetch({ error: 'Invalid credentials' }, false, 401)

    const result = await useAuthStore.getState().login({ email: 'x@x.com', password: 'wrong' })

    expect(result.ok).toBe(false)
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(useAuthStore.getState().error).toBeTruthy()
    expect(useAuthStore.getState().sessionExpired).toBe(false)
  })

  // ── register ─────────────────────────────────────────────────────────────────

  it('register calls POST /api/auth/register and stores user + token on success', async () => {
    const fakeUser = { id: '2', email: 'admin@test.com', username: 'admin', role: 'admin' }
    mockFetch({ user: fakeUser, token: 'real-jwt' }, true, 201)

    const result = await useAuthStore.getState().register({
      email: 'admin@test.com',
      username: 'admin',
      password: 'pass',
      role: 'admin',
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(result.ok).toBe(true)
    const { user, token, isLoggedIn, userRole } = useAuthStore.getState()
    expect(user).toEqual(fakeUser)
    expect(token).toBe('real-jwt')
    expect(isLoggedIn).toBe(true)
    expect(userRole).toBe('admin')
  })

  it('register sets error and returns ok:false on server error', async () => {
    mockFetch({ error: 'Email already registered' }, false, 409)

    const result = await useAuthStore.getState().register({
      email: 'dup@test.com', username: 'dup', password: 'pass', role: 'developer',
    })

    expect(result.ok).toBe(false)
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(useAuthStore.getState().error).toBeTruthy()
  })

  // ── logout ───────────────────────────────────────────────────────────────────

  it('connectJira stores jira_connected on user', async () => {
    useAuthStore.setState({ token: 'jwt', user: { id: '1', role: 'developer' } })
    mockFetch({ user: { id: '1', role: 'developer', jira_connected: true } })

    const result = await useAuthStore.getState().connectJira('dev-token')

    expect(result.ok).toBe(true)
    expect(useAuthStore.getState().user.jira_connected).toBe(true)
  })

  it('disconnectJira clears jira_connected on user', async () => {
    useAuthStore.setState({
      token: 'jwt',
      user: { id: '1', role: 'developer', jira_connected: true },
    })
    mockFetch({ user: { id: '1', role: 'developer', jira_connected: false } })

    const result = await useAuthStore.getState().disconnectJira()

    expect(result.ok).toBe(true)
    expect(useAuthStore.getState().user.jira_connected).toBe(false)
  })

  it('connectJira returns ok:false on server error', async () => {
    useAuthStore.setState({ token: 'jwt', user: { id: '1', role: 'developer' } })
    mockFetch({ error: 'Invalid Jira credentials' }, false, 400)

    const result = await useAuthStore.getState().connectJira('bad-token')

    expect(result.ok).toBe(false)
    expect(useAuthStore.getState().error).toBe('Invalid Jira credentials')
  })

  it('disconnectJira returns ok:false on server error', async () => {
    useAuthStore.setState({
      token: 'jwt',
      user: { id: '1', role: 'developer', jira_connected: true },
    })
    mockFetch({ error: 'Server error' }, false, 500)

    const result = await useAuthStore.getState().disconnectJira()

    expect(result.ok).toBe(false)
    expect(useAuthStore.getState().error).toBe('Server error')
  })

  it('logout clears all auth state', async () => {
    mockFetch({ message: 'Logged out' })
    useAuthStore.setState({
      user: { id: '1', email: 'dev@test.com', username: 'dev', role: 'developer' },
      token: 'some-jwt',
      isLoggedIn: true,
      userRole: 'developer',
    })

    await useAuthStore.getState().logout()

    const { user, token, isLoggedIn, userRole, isLoading, error } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(token).toBeNull()
    expect(isLoggedIn).toBe(false)
    expect(userRole).toBe('developer')
    expect(isLoading).toBe(false)
    expect(error).toBeNull()
  })

  it('logout sets sessionExpired when requested', async () => {
    mockFetch({ message: 'Logged out' })
    useAuthStore.setState({ token: 'jwt', isLoggedIn: true })

    await useAuthStore.getState().logout({ sessionExpired: true })

    expect(useAuthStore.getState().sessionExpired).toBe(true)
  })

  it('logout clears local state even when server logout fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    useAuthStore.setState({ token: 'jwt', isLoggedIn: true, user: { id: '1' } })

    await useAuthStore.getState().logout()

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
  })

  it('clearSessionExpired resets flag', () => {
    useAuthStore.setState({ sessionExpired: true })
    useAuthStore.getState().clearSessionExpired()
    expect(useAuthStore.getState().sessionExpired).toBe(false)
  })

  it('fetchMe returns null when no token', async () => {
    const user = await useAuthStore.getState().fetchMe()
    expect(user).toBeNull()
  })

  it('fetchMe stores user when token is present', async () => {
    const fakeUser = { id: '1', role: 'developer', current_sprint_xp: 40, coin_balance: 4 }
    useAuthStore.setState({ token: 'jwt' })
    mockFetch({ user: fakeUser })

    const user = await useAuthStore.getState().fetchMe()

    expect(user).toEqual(fakeUser)
    expect(useAuthStore.getState().user).toEqual(fakeUser)
  })

  it('fetchMe returns null on server error', async () => {
    useAuthStore.setState({ token: 'jwt' })
    mockFetch({ error: 'Server error' }, false, 500)

    const user = await useAuthStore.getState().fetchMe()

    expect(user).toBeNull()
  })

  it('startJiraOAuth redirects to authorize URL on success', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { assign })
    useAuthStore.setState({ token: 'jwt' })
    mockFetch({ authorize_url: 'https://auth.atlassian.com/authorize' })

    const result = await useAuthStore.getState().startJiraOAuth('/admin')

    expect(result.ok).toBe(true)
    expect(assign).toHaveBeenCalledWith('https://auth.atlassian.com/authorize')
  })

  it('startJiraOAuth returns ok:false on error', async () => {
    useAuthStore.setState({ token: 'jwt' })
    mockFetch({ error: 'OAuth unavailable' }, false, 503)

    const result = await useAuthStore.getState().startJiraOAuth()

    expect(result.ok).toBe(false)
    expect(useAuthStore.getState().error).toBe('OAuth unavailable')
  })

  it('fetchJiraOAuthStatus returns unavailable when no token', async () => {
    const status = await useAuthStore.getState().fetchJiraOAuthStatus()
    expect(status).toEqual({ available: false })
  })

  it('fetchJiraOAuthStatus returns status when token present', async () => {
    useAuthStore.setState({ token: 'jwt' })
    mockFetch({ available: true, connected: false })

    const status = await useAuthStore.getState().fetchJiraOAuthStatus()

    expect(status.available).toBe(true)
  })

  it('fetchJiraOAuthStatus returns unavailable on error', async () => {
    useAuthStore.setState({ token: 'jwt' })
    mockFetch({ error: 'Server error' }, false, 500)

    const status = await useAuthStore.getState().fetchJiraOAuthStatus()

    expect(status).toEqual({ available: false })
  })
})
