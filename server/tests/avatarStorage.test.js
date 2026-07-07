require('dotenv').config()
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
    expect(avatarStorage.isManagedAvatarUrl('/api/uploads/avatars/user.png')).toBe(true)
    expect(avatarStorage.isManagedAvatarUrl('https://cdn.example.com/other.png')).toBe(false)
  })

  test('detects managed object-storage avatar URLs', () => {
    process.env.S3_PUBLIC_URL = 'https://cdn.example.com'
    expect(avatarStorage.isManagedAvatarUrl('https://cdn.example.com/avatars/user.png')).toBe(true)
  })

  test('uploads to local disk in local mode', async () => {
    process.env.AVATAR_STORAGE = 'local'
    const userId = '11111111-1111-4111-8111-111111111111'
    const url = await avatarStorage.uploadAvatar(userId, {
      buffer: Buffer.from('fake-image'),
      mimetype: 'image/png',
      originalname: 'avatar.png',
    })

    expect(url).toBe(`/api/uploads/avatars/${userId}.png`)
    await avatarStorage.deleteManagedAvatar(url)
  })
})
