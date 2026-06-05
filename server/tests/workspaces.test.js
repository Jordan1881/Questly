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

async function createWorkspaceAsAdmin(name = 'Acme Corp', suffix = '') {
  const token = await registerAndLogin('admin', suffix)
  const res = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${token}`)
    .send({ name })
  return { token, workspace: res.body.workspace }
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

// ── GET /api/workspaces/:id ───────────────────────────────────────────────────

describe('GET /api/workspaces/:id', () => {
  test('admin who created the workspace receives 200 with workspace details', async () => {
    const { token, workspace } = await createWorkspaceAsAdmin('Acme Corp')

    const res = await request(app)
      .get(`/api/workspaces/${workspace.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.workspace).toMatchObject({
      id: workspace.id,
      name: 'Acme Corp',
      admin_id: workspace.admin_id,
    })
    expect(res.body.workspace.jira_access_token).toBeUndefined()
  })

  test('developer who belongs to the workspace receives 200', async () => {
    const { workspace } = await createWorkspaceAsAdmin('Member Workspace')
    const devToken = await registerAndLogin('developer', 'member')

    const devUser = await db('users').where({ email: 'devmember@test.com' }).first()
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    const res = await request(app)
      .get(`/api/workspaces/${workspace.id}`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(200)
    expect(res.body.workspace.id).toBe(workspace.id)
  })

  test('developer from a different workspace receives 403', async () => {
    const { workspace: workspaceA } = await createWorkspaceAsAdmin('Workspace A', 'a')
    const { workspace: workspaceB } = await createWorkspaceAsAdmin('Workspace B', 'b')
    const devToken = await registerAndLogin('developer', 'outsider')

    const devUser = await db('users').where({ email: 'devoutsider@test.com' }).first()
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspaceA.id })

    const res = await request(app)
      .get(`/api/workspaces/${workspaceB.id}`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(403)
  })

  test('unauthenticated request receives 401', async () => {
    const { workspace } = await createWorkspaceAsAdmin()

    const res = await request(app).get(`/api/workspaces/${workspace.id}`)

    expect(res.status).toBe(401)
  })

  test('unknown workspace id receives 404', async () => {
    const token = await registerAndLogin('admin', '404')

    const res = await request(app)
      .get('/api/workspaces/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})
