const sharp = require('sharp')
const { processAvatarImage, AVATAR_SIZE } = require('../lib/avatarImage')

describe('avatarImage', () => {
  test('produces a square WebP at the target size', async () => {
    const source = await sharp({
      create: {
        width: 800,
        height: 400,
        channels: 3,
        background: { r: 148, g: 47, b: 205 },
      },
    })
      .jpeg()
      .toBuffer()

    const processed = await processAvatarImage({
      buffer: source,
      mimetype: 'image/jpeg',
      originalname: 'photo.jpg',
    })

    expect(processed.mimetype).toBe('image/webp')
    expect(processed.ext).toBe('.webp')

    const meta = await sharp(processed.buffer).metadata()
    expect(meta.width).toBe(AVATAR_SIZE)
    expect(meta.height).toBe(AVATAR_SIZE)
    expect(meta.format).toBe('webp')
  })
})
