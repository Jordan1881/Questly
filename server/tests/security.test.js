require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  await db('join_requests').del()
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

async function registerAndLogin(role = 'admin', suffix = '') {
  const email = role === 'admin' ? `admin${suffix}@test.com` : `dev${suffix}@test.com`
  const username = role === 'admin' ? `admin${suffix}` : `dev${suffix}`
  await request(app)
    .post('/api/auth/register')
    .send({ email, username, password: 'password123', role })
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' })
  return res.body.token
}

describe('security access control', () => {
  test('developer calling POST /api/workspaces receives 403', async () => {
    const token = await registerAndLogin('developer', 'sec')

    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Blocked' })

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Forbidden')
  })

  test('unauthenticated POST /api/workspaces receives 401', async () => {
    const res = await request(app).post('/api/workspaces').send({ name: 'No Auth' })
    expect(res.status).toBe(401)
  })

  test('unauthenticated GET /api/workspaces/:id/members receives 401', async () => {
    const adminToken = await registerAndLogin('admin', 'sec2')
    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Secure' })

    const res = await request(app).get(
      `/api/workspaces/${workspaceRes.body.workspace.id}/members`
    )

    expect(res.status).toBe(401)
  })

  test('developer calling admin join-request list receives 403', async () => {
    const adminToken = await registerAndLogin('admin', 'sec3')
    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Secure3' })
    const devToken = await registerAndLogin('developer', 'sec3')

    const res = await request(app)
      .get(`/api/workspaces/${workspaceRes.body.workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(403)
  })
})
