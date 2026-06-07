const express = require('express')
const request = require('supertest')
const rateLimit = require('express-rate-limit')

describe('auth rate limiting', () => {
  function buildApp(max = 2) {
    const app = express()
    app.set('trust proxy', 1)
    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests' },
    })
    app.post('/login', limiter, (_req, res) => res.json({ ok: true }))
    return app
  }

  it('returns 429 after exceeding the configured max', async () => {
    const app = buildApp(2)

    await request(app).post('/login').expect(200)
    await request(app).post('/login').expect(200)
    const blocked = await request(app).post('/login')

    expect(blocked.status).toBe(429)
    expect(blocked.body.error).toMatch(/Too many/i)
  })
})
