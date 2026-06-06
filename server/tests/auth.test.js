require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')

const app = createApp()

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

// ── helpers ──────────────────────────────────────────────────────────────────

async function registerUser(overrides = {}) {
  return request(app)
    .post('/api/auth/register')
    .send({ email: 'dev@test.com', username: 'dev', password: 'password123', role: 'developer', ...overrides })
}

async function loginUser(overrides = {}) {
  return request(app)
    .post('/api/auth/login')
    .send({ email: 'dev@test.com', password: 'password123', ...overrides })
}

async function getValidToken(role = 'developer') {
  const email = role === 'admin' ? 'admin@test.com' : 'dev@test.com'
  const username = role === 'admin' ? 'admin' : 'dev'
  await registerUser({ email, username, role })
  const res = await loginUser({ email })
  return res.body.token
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('returns 201 with user shape and a token on success', async () => {
    const res = await registerUser()

    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ email: 'dev@test.com', username: 'dev', role: 'developer' })
    expect(res.body.user.id).toBeDefined()
    expect(res.body.user.password_hash).toBeUndefined()
    expect(res.body.token).toBeDefined()
  })

  test('returns 409 when email is already registered', async () => {
    await registerUser()
    const res = await registerUser()

    expect(res.status).toBe(409)
  })

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@test.com' })

    expect(res.status).toBe(400)
  })
})

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await registerUser()
  })

  test('returns 200 with user shape and a token on valid credentials', async () => {
    const res = await loginUser()

    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ email: 'dev@test.com', username: 'dev', role: 'developer' })
    expect(res.body.user.password_hash).toBeUndefined()
    expect(res.body.token).toBeDefined()
  })

  test('returns 401 on wrong password', async () => {
    const res = await loginUser({ password: 'wrong' })

    expect(res.status).toBe(401)
  })

  test('returns 401 on unknown email with the same message as wrong password', async () => {
    const wrongEmail = await loginUser({ email: 'nobody@test.com' })
    const wrongPassword = await loginUser({ password: 'wrong' })

    expect(wrongEmail.status).toBe(401)
    expect(wrongEmail.body.error).toBe(wrongPassword.body.error)
  })
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  test('returns 200 with full user profile on valid token', async () => {
    const token = await getValidToken()
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({
      email: 'dev@test.com',
      username: 'dev',
      role: 'developer',
    })
    expect(['workspace_id', 'avatar_url', 'current_sprint_xp', 'lifetime_xp', 'jira_connected'].every(
      (k) => k in res.body.user
    )).toBe(true)
    expect(res.body.user.password_hash).toBeUndefined()
  })

  test('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me')

    expect(res.status).toBe(401)
  })

  test('returns 401 with a tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.valid.token')

    expect(res.status).toBe(401)
  })
})

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  test('returns 200 on valid token', async () => {
    const token = await getValidToken()
    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Logged out')
  })

  test('returns 401 without a token', async () => {
    const res = await request(app).post('/api/auth/logout')

    expect(res.status).toBe(401)
  })
})
