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
  await db('sprints').del()
  await db('join_requests').del()
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
  return { token: res.body.token, user: res.body.user }
}

async function createWorkspace(adminToken, suffix = '') {
  const res = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Workspace ${suffix}` })
  return res.body.workspace
}

describe('Sprint API', () => {
  it('POST /workspaces/:id/sprints creates active sprint', async () => {
    const { token } = await registerAndLogin('admin', '1')
    const workspace = await createWorkspace(token, '1')

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sprint 1', startDate: '2026-06-01', endDate: '2026-06-14' })

    expect(res.status).toBe(201)
    expect(res.body.sprint.name).toBe('Sprint 1')
    expect(res.body.sprint.status).toBe('active')
  })

  it('POST /workspaces/:id/sprints returns 409 when active sprint exists', async () => {
    const { token } = await registerAndLogin('admin', '2')
    const workspace = await createWorkspace(token, '2')

    await request(app)
      .post(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sprint A' })

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sprint B' })

    expect(res.status).toBe(409)
  })

  it('GET /workspaces/:id/sprints lists sprints newest startDate first', async () => {
    const { token: adminToken } = await registerAndLogin('admin', '3')
    const workspace = await createWorkspace(adminToken, '3')
    const { token: devToken, user: devUser } = await registerAndLogin('developer', '3dev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    await request(app)
      .post(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Older', startDate: '2026-05-01' })

    const first = await db('sprints').where({ workspace_id: workspace.id }).first()
    await db('sprints').where({ id: first.id }).update({ status: 'completed', closed_at: db.fn.now() })

    await request(app)
      .post(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Newer', startDate: '2026-06-01' })

    const res = await request(app)
      .get(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(200)
    expect(res.body.sprints).toHaveLength(2)
    expect(res.body.sprints[0].name).toBe('Newer')
  })

  it('GET /workspaces/:id/sprints/active returns active sprint or null', async () => {
    const { token } = await registerAndLogin('admin', '4')
    const workspace = await createWorkspace(token, '4')

    const empty = await request(app)
      .get(`/api/workspaces/${workspace.id}/sprints/active`)
      .set('Authorization', `Bearer ${token}`)

    expect(empty.status).toBe(200)
    expect(empty.body.sprint).toBeNull()

    await request(app)
      .post(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Active Sprint', endDate: '2026-12-31' })

    const active = await request(app)
      .get(`/api/workspaces/${workspace.id}/sprints/active`)
      .set('Authorization', `Bearer ${token}`)

    expect(active.status).toBe(200)
    expect(active.body.sprint.name).toBe('Active Sprint')
    expect(active.body.sprint.daysRemaining).toBeGreaterThanOrEqual(0)
  })

  it('PATCH /sprints/:id updates name and dates', async () => {
    const { token } = await registerAndLogin('admin', '5')
    const workspace = await createWorkspace(token, '5')

    const created = await request(app)
      .post(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Original' })

    const res = await request(app)
      .patch(`/api/sprints/${created.body.sprint.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed', endDate: '2026-07-01' })

    expect(res.status).toBe(200)
    expect(res.body.sprint.name).toBe('Renamed')
    expect(res.body.sprint.endDate).toBe('2026-07-01')
  })

  it('POST /sprints/:id/close resets member sprint XP and writes sprint_reset transactions', async () => {
    const { token: adminToken, user: adminUser } = await registerAndLogin('admin', '6')
    const workspace = await createWorkspace(adminToken, '6')

    const { user: devUser } = await registerAndLogin('developer', '6dev')
    await db('users')
      .where({ id: devUser.id })
      .update({ workspace_id: workspace.id, current_sprint_xp: 80 })

    const created = await request(app)
      .post(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Close Me' })

    const res = await request(app)
      .post(`/api/sprints/${created.body.sprint.id}/close`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.sprint.status).toBe('completed')

    const dev = await db('users').where({ id: devUser.id }).first()
    expect(dev.current_sprint_xp).toBe(0)

    const tx = await db('xp_transactions')
      .where({ user_id: devUser.id, reason: 'sprint_reset' })
      .first()
    expect(tx.amount).toBe(-80)
    expect(tx.sprint_id).toBe(created.body.sprint.id)

    expect(adminUser.id).toBeTruthy()
  })

  it('POST /sprints/:id/close returns 409 when already completed', async () => {
    const { token } = await registerAndLogin('admin', '7')
    const workspace = await createWorkspace(token, '7')

    const created = await request(app)
      .post(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Done' })

    await request(app)
      .post(`/api/sprints/${created.body.sprint.id}/close`)
      .set('Authorization', `Bearer ${token}`)

    const res = await request(app)
      .post(`/api/sprints/${created.body.sprint.id}/close`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(409)
  })
})
