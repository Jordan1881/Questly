import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildAvatarSrc } from '../../components/ProfileAvatar'

describe('buildAvatarSrc', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('appends a retina width query for API avatars', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.questly.test')
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 2,
    })

    expect(buildAvatarSrc('/api/uploads/avatars/u.webp?v=1', 128)).toBe(
      'https://api.questly.test/api/uploads/avatars/u.webp?v=1&w=256',
    )
  })
})
