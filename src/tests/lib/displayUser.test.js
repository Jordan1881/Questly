import { describe, it, expect } from 'vitest'
import { getAvatarUrl, getDisplayUsername, getLifetimeXp } from '../../lib/displayUser'

describe('displayUser helpers', () => {
  it('returns username when set', () => {
    expect(getDisplayUsername({ username: 'Jordan' }, 'admin')).toBe('Jordan')
  })

  it('falls back by role when username missing', () => {
    expect(getDisplayUsername(null, 'admin')).toBe('Admin')
    expect(getDisplayUsername({}, 'developer')).toBe('Developer')
  })

  it('reads avatar and lifetime xp from snake or camel case', () => {
    expect(getAvatarUrl({ avatar_url: 'https://x.test/a.png' })).toBe('https://x.test/a.png')
    expect(getAvatarUrl({ avatarUrl: 'https://x.test/b.png' })).toBe('https://x.test/b.png')
    expect(getLifetimeXp({ lifetime_xp: 1200 })).toBe(1200)
    expect(getLifetimeXp({ lifetimeXp: 500 })).toBe(500)
  })
})
