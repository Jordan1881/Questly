require('dotenv').config()
const jwt = require('jsonwebtoken')
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const config = require('../config')
const app = createApp()

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  })
}

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  await db('sprints').del()
  await db('purchases').del()
  await db('reward_coupons').del()
  await db('rewards').del()
  await db('users').del()
  await db('workspaces').del()
})

afterAll(async () => {
  await db.destroy()
})

describe('JWT helpers', () => {
  test('signToken returns a valid JWT that decodes with correct payload', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'jwt@test.com',
        username: 'jwtuser',
        password: 'password123',
        role: 'developer',
      })

    const user = await db('users').where({ email: 'jwt@test.com' }).first()
    const token = signToken(user)
    const payload = jwt.verify(token, config.jwt.secret)

    expect(payload.sub).toBe(user.id)
    expect(payload.role).toBe('developer')
  })

  test('verifyToken middleware rejects expired token with 401', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'expired@test.com',
        username: 'expired',
        password: 'password123',
        role: 'developer',
      })

    const user = await db('users').where({ email: 'expired@test.com' }).first()
    const expiredToken = jwt.sign({ sub: user.id, role: user.role }, config.jwt.secret, {
      expiresIn: '-1s',
    })

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid or expired token')
  })

  test('verifyToken middleware rejects tampered token with 401', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tamper@test.com',
        username: 'tamper',
        password: 'password123',
        role: 'developer',
      })

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tamper@test.com', password: 'password123' })

    const tampered = `${loginRes.body.token.slice(0, -4)}aaaa`

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tampered}`)

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid or expired token')
  })
})
