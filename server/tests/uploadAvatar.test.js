const request = require('supertest')
const express = require('express')
const sharp = require('sharp')
const limits = require('../lib/avatarUploadLimits')
const {
  uploadAvatarMiddleware,
  hasAllowedImageMagic,
  MAX_BYTES,
} = require('../middleware/uploadAvatar')

function makeApp() {
  const app = express()
  app.post('/avatar', uploadAvatarMiddleware, (req, res) => {
    res.status(200).json({ ok: true, bytes: req.file.buffer.length })
  })
  return app
}

const app = makeApp()

describe('hasAllowedImageMagic', () => {
  test('accepts PNG/JPEG magic and rejects plain text', async () => {
    const png = await sharp({
      create: { width: 16, height: 16, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .png()
      .toBuffer()
    const jpeg = await sharp({
      create: { width: 16, height: 16, channels: 3, background: { r: 4, g: 5, b: 6 } },
    })
      .jpeg()
      .toBuffer()

    expect(hasAllowedImageMagic(png)).toBe(true)
    expect(hasAllowedImageMagic(jpeg)).toBe(true)
    expect(hasAllowedImageMagic(Buffer.from('hello world!!!!'))).toBe(false)
    expect(hasAllowedImageMagic(Buffer.alloc(4))).toBe(false)
  })
})

describe('uploadAvatarMiddleware', () => {
  let avatarPng

  beforeAll(async () => {
    avatarPng = await sharp({
      create: {
        width: 480,
        height: 480,
        channels: 3,
        background: { r: 148, g: 47, b: 205 },
      },
    })
      .png()
      .toBuffer()
  })

  test('accepts a valid PNG under the size limit', async () => {
    const res = await request(app).post('/avatar').attach('avatar', avatarPng, 'avatar.png')

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  test('rejects files larger than the shared maxBytes limit', async () => {
    expect(MAX_BYTES).toBe(limits.maxBytes)
    // Prefer Content-Length pre-check over streaming a multi-MB body (avoids flaky ECONNRESET).
    const res = await request(app)
      .post('/avatar')
      .set('Content-Type', 'multipart/form-data; boundary=----questly')
      .set('Content-Length', String(limits.maxBytes + 1024))
      .send('------questly--\r\n')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(new RegExp(limits.maxMbLabel, 'i'))
  })

  test('rejects when Content-Length is present and exceeds maxBytes', async () => {
    expect(MAX_BYTES).toBe(limits.maxBytes)
    const res = await request(app)
      .post('/avatar')
      .set('Content-Type', 'multipart/form-data; boundary=----questly')
      .set('Content-Length', String(limits.maxBytes + 1))
      .send('------questly--\r\n')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(new RegExp(limits.maxMbLabel, 'i'))
  })

  test('rejects non-numeric Content-Length', async () => {
    const req = { headers: { 'content-length': 'nope' } }
    const res = {
      statusCode: 0,
      body: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        this.body = payload
        return this
      },
    }
    let nextCalled = false

    await new Promise((resolve) => {
      uploadAvatarMiddleware(req, res, () => {
        nextCalled = true
        resolve()
      })
      // Middleware responds synchronously for bad Content-Length
      setImmediate(resolve)
    })

    expect(nextCalled).toBe(false)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/Content-Length/i)
  })

  test('rejects spoofed MIME when magic bytes are not an image', async () => {
    const fake = Buffer.from('definitely-not-an-image-payload')

    const res = await request(app)
      .post('/avatar')
      .attach('avatar', fake, { filename: 'avatar.png', contentType: 'image/png' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/not a valid/i)
  })

  test('shared limits match expected P1 values', () => {
    expect(limits.maxBytes).toBe(2 * 1024 * 1024)
    expect(limits.maxMbLabel).toBe('2 MB')
    expect(MAX_BYTES).toBe(limits.maxBytes)
  })
})
