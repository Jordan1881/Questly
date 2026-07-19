require('dotenv').config()
const sharp = require('sharp')
const request = require('supertest')
const createApp = require('../app')
const avatarStorage = require('../lib/avatarStorage')
const { clearAvatarRenderCache } = require('../lib/avatarServe')

const app = createApp()

describe('avatarServe', () => {
  const userId = '22222222-2222-4222-8222-222222222222'

  beforeAll(async () => {
    process.env.AVATAR_STORAGE = 'local'
    const source = await sharp({
      create: {
        width: 1200,
        height: 900,
        channels: 3,
        background: { r: 40, g: 120, b: 200 },
      },
    })
      .jpeg()
      .toBuffer()

    await avatarStorage.uploadAvatar(userId, {
      buffer: source,
      mimetype: 'image/jpeg',
      originalname: 'portrait.jpg',
    })
    clearAvatarRenderCache()
  })

  afterAll(async () => {
    await avatarStorage.deleteManagedAvatar(`/api/uploads/avatars/${userId}.webp`)
  })

  test('serves a retina width variant via ?w=', async () => {
    const res = await request(app).get(`/api/uploads/avatars/${userId}.webp?w=256`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/image\/webp/)

    const meta = await sharp(res.body).metadata()
    expect(meta.width).toBe(256)
    expect(meta.height).toBe(256)
  })

  test('rejects unsafe filenames', async () => {
    const res = await request(app).get('/api/uploads/avatars/not-valid.exe')
    expect(res.status).toBe(400)
  })
})
