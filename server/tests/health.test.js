const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')

const app = createApp()

afterAll(async () => {
  await db.destroy()
})

describe('health endpoints', () => {
  test('GET /api/health is a cheap liveness check', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  test('GET /api/health/ready verifies the database is reachable', async () => {
    const res = await request(app).get('/api/health/ready')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ready', db: 'up' })
  })

  test('the versioned alias /api/v1 serves the same routes', async () => {
    const res = await request(app).get('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  test('sets a X-Request-Id response header for tracing', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-request-id']).toBeTruthy()
  })
})
