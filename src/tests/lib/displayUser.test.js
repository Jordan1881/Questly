import { describe, it, expect, vi, afterEach } from 'vitest'
import { getAvatarUrl, getDisplayUsername, getLifetimeXp, resolveAvatarUrl } from '../../lib/displayUser'

describe('displayUser', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('falls back to role label when username missing', () => {
    expect(getDisplayUsername(null, 'admin')).toBe('Admin')
    expect(getDisplayUsername({ username: '  ' }, 'developer')).toBe('Developer')
    expect(getDisplayUsername({ username: 'Yarden' }, 'developer')).toBe('Yarden')
  })

  it('reads avatar and lifetime xp from snake or camel case', () => {
    expect(getAvatarUrl({ avatar_url: 'https://x.test/a.png' })).toBe('https://x.test/a.png')
    expect(getAvatarUrl({ avatarUrl: 'https://x.test/b.png' })).toBe('https://x.test/b.png')
    expect(getLifetimeXp({ lifetime_xp: 120 })).toBe(120)
    expect(getLifetimeXp({ lifetimeXp: 80 })).toBe(80)
  })

  it('resolves relative avatar paths against the API base', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.questly.test')
    expect(resolveAvatarUrl('/api/uploads/avatars/u.webp?v=1')).toBe(
      'https://api.questly.test/api/uploads/avatars/u.webp?v=1',
    )
    expect(resolveAvatarUrl('https://cdn.test/a.webp')).toBe('https://cdn.test/a.webp')
    expect(resolveAvatarUrl('blob:preview')).toBe('blob:preview')
    expect(resolveAvatarUrl(null)).toBeNull()
  })
})
