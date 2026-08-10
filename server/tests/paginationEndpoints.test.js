const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const { cleanupCoreTables } = require('./helpers/cleanup')

const app = createApp()

async function registerLogin(email, role) {
  await request(app)
    .post('/api/auth/register')
    .send({ email, username: email.split('@')[0], password: 'password123', role })
  const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' })
  return { token: res.body.token, user: res.body.user }
}

describe('backward-compatible pagination on list endpoints', () => {
  let adminToken
  let adminId
  let workspaceId

  beforeAll(async () => {
    await db.migrate.latest()
  })

  beforeEach(async () => {
    await cleanupCoreTables(db)

    const admin = await registerLogin('admin-pge@test.com', 'admin')
    adminToken = admin.token
    adminId = admin.user.id
    const ws = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Pagination Endpoints WS' })
    workspaceId = ws.body.workspace.id
  })

  afterAll(async () => {
    await db.destroy()
  })

  test('sprints: limit bounds rows and sets X-Total-Count', async () => {
    await db('sprints').insert([
      { workspace_id: workspaceId, name: 'S1', status: 'completed', created_by: adminId },
      { workspace_id: workspaceId, name: 'S2', status: 'completed', created_by: adminId },
      { workspace_id: workspaceId, name: 'S3', status: 'completed', created_by: adminId },
    ])

    const all = await request(app)
      .get(`/api/workspaces/${workspaceId}/sprints`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(all.status).toBe(200)
    expect(all.body.sprints).toHaveLength(3)
    expect(all.headers['x-total-count']).toBeUndefined()

    const page = await request(app)
      .get(`/api/workspaces/${workspaceId}/sprints?limit=2`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(page.status).toBe(200)
    expect(page.body.sprints).toHaveLength(2)
    expect(page.headers['x-total-count']).toBe('3')
  })

  test('join-requests: limit bounds rows and sets X-Total-Count', async () => {
    const devs = []
    for (let i = 0; i < 3; i += 1) {
      const dev = await registerLogin(`jrdev${i}@test.com`, 'developer')
      devs.push(dev.user.id)
    }
    await db('join_requests').insert(
      devs.map((user_id) => ({ user_id, workspace_id: workspaceId })),
    )

    const page = await request(app)
      .get(`/api/workspaces/${workspaceId}/join-requests?limit=2&offset=0`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(page.status).toBe(200)
    expect(page.body.join_requests).toHaveLength(2)
    expect(page.headers['x-total-count']).toBe('3')
  })

  test('members: limit bounds rows and sets X-Total-Count', async () => {
    for (let i = 0; i < 3; i += 1) {
      const dev = await registerLogin(`memdev${i}@test.com`, 'developer')
      await db('users').where({ id: dev.user.id }).update({ workspace_id: workspaceId })
    }

    const page = await request(app)
      .get(`/api/workspaces/${workspaceId}/members?limit=2`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(page.status).toBe(200)
    expect(page.body.members).toHaveLength(2)
    expect(Number(page.headers['x-total-count'])).toBeGreaterThanOrEqual(3)
  })
})
