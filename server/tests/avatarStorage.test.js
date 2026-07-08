require('dotenv').config()
const sharp = require('sharp')
const avatarStorage = require('../lib/avatarStorage')

describe('avatarStorage', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  test('uses local mode by default', () => {
    delete process.env.AVATAR_STORAGE
    expect(avatarStorage.storageMode()).toBe('local')
    expect(avatarStorage.isLocalMode()).toBe(true)
  })

  test('detects managed local avatar URLs', () => {
    expect(avatarStorage.isManagedAvatarUrl('/api/uploads/avatars/user.webp')).toBe(true)
    expect(avatarStorage.isManagedAvatarUrl('/api/uploads/avatars/user.webp?v=123')).toBe(true)
    expect(avatarStorage.isManagedAvatarUrl('https://cdn.example.com/other.png')).toBe(false)
  })

  test('detects managed object-storage avatar URLs', () => {
    process.env.S3_PUBLIC_URL = 'https://cdn.example.com'
    expect(avatarStorage.isManagedAvatarUrl('https://cdn.example.com/avatars/user.webp')).toBe(true)
    expect(avatarStorage.isManagedAvatarUrl('https://cdn.example.com/avatars/user.webp?v=9')).toBe(true)
  })

  test('uploads processed WebP to local disk in local mode', async () => {
    process.env.AVATAR_STORAGE = 'local'
    const userId = '11111111-1111-4111-8111-111111111111'
    const source = await sharp({
      create: {
        width: 640,
        height: 480,
        channels: 3,
        background: { r: 148, g: 47, b: 205 },
      },
    })
      .png()
      .toBuffer()

    const url = await avatarStorage.uploadAvatar(userId, {
      buffer: source,
      mimetype: 'image/png',
      originalname: 'avatar.png',
    })

    expect(url).toMatch(/^\/api\/uploads\/avatars\/11111111-1111-4111-8111-111111111111\.webp\?v=\d+$/)
    await avatarStorage.deleteManagedAvatar(url)
  })
})
