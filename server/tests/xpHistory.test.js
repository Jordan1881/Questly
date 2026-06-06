require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  await db('xp_transactions').del()
  await db('task_assignments').del()
  await db('tasks').del()
  await db('sprints').del()
  await db('join_requests').del()
  await db('users').del()
  await db('workspaces').del()
})

afterAll(async () => {
  await db.destroy()
})

async function registerAndLogin(role = 'developer', suffix = '') {
  const email = `user${suffix}@test.com`
  await request(app)
    .post('/api/auth/register')
    .send({ email, username: `user${suffix}`, password: 'password123', role })
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' })
  return { token: res.body.token, user: res.body.user }
}

describe('GET /api/users/me/xp-history', () => {
  it('returns XP transactions newest first after task completion', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'hist-admin')
    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Hist WS' })

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'hist-dev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspaceRes.body.workspace.id })

    await db('xp_transactions').insert({
      user_id: devUser.id,
      amount: 40,
      reason: 'task_completed',
      created_at: new Date('2026-06-01T10:00:00Z'),
    })
    await db('xp_transactions').insert({
      user_id: devUser.id,
      amount: 20,
      reason: 'task_completed',
      created_at: new Date('2026-06-02T10:00:00Z'),
    })

    const res = await request(app)
      .get('/api/users/me/xp-history')
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(200)
    expect(res.body.transactions).toHaveLength(2)
    expect(res.body.transactions[0].amount).toBe(20)
    expect(res.body.transactions[0]).toMatchObject({
      reason: 'task_completed',
      taskId: null,
    })
    expect(res.body.transactions[0].createdAt).toBeTruthy()
  })

  it('returns 403 for admin role', async () => {
    const { token } = await registerAndLogin('admin', 'hist-admin403')
    const res = await request(app)
      .get('/api/users/me/xp-history')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})
