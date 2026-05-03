require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  await db('users').del()
  await db('workspaces').del()
})

afterAll(async () => {
  await db.destroy()
})

// ── helpers ───────────────────────────────────────────────────────────────────

async function registerAndLogin(role = 'admin') {
  const email = role === 'admin' ? 'admin@test.com' : 'dev@test.com'
  const username = role === 'admin' ? 'admin' : 'dev'
  await request(app)
    .post('/api/auth/register')
    .send({ email, username, password: 'password123', role })
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' })
  return res.body.token
}

// ── POST /api/workspaces ──────────────────────────────────────────────────────

describe('POST /api/workspaces', () => {
  test('admin creates a workspace and gets 201 with workspace shape', async () => {
    const token = await registerAndLogin('admin')
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme Corp' })

    expect(res.status).toBe(201)
    expect(res.body.workspace).toMatchObject({ name: 'Acme Corp' })
    expect(res.body.workspace.id).toBeDefined()
    expect(res.body.workspace.admin_id).toBeDefined()
  })

  test('developer receives 403', async () => {
    const token = await registerAndLogin('developer')
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme Corp' })

    expect(res.status).toBe(403)
  })

  test('unauthenticated request receives 401', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .send({ name: 'Acme Corp' })

    expect(res.status).toBe(401)
  })

  test('admin with missing name receives 400', async () => {
    const token = await registerAndLogin('admin')
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
  })
})
