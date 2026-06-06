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
    expect(res.body.workspace.code).toMatch(/^[A-Z2-9]{8}$/)
    expect(res.body.workspace.jira_access_token).toBeUndefined()
  })

  test('each workspace gets a unique shareable code', async () => {
    const token = await registerAndLogin('admin', 'codes')
    const first = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'First' })
    const second = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Second' })

    expect(first.body.workspace.code).toBeDefined()
    expect(second.body.workspace.code).toBeDefined()
    expect(first.body.workspace.code).not.toBe(second.body.workspace.code)
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

// ── PATCH /api/workspaces/:id ─────────────────────────────────────────────────

describe('PATCH /api/workspaces/:id', () => {
  test('workspace admin updates name and settings', async () => {
    const { token, workspace } = await createWorkspaceAsAdmin('Acme Corp', 'patch')

    const res = await request(app)
      .patch(`/api/workspaces/${workspace.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Acme Labs',
        jira_project_key: 'QUEST',
        jira_site_url: 'https://acme.atlassian.net',
      })

    expect(res.status).toBe(200)
    expect(res.body.workspace).toMatchObject({
      id: workspace.id,
      name: 'Acme Labs',
      code: workspace.code,
      jira_project_key: 'QUEST',
      jira_site_url: 'https://acme.atlassian.net',
    })
    expect(res.body.workspace.jira_access_token).toBeUndefined()
  })

  test('developer receives 403', async () => {
    const { workspace } = await createWorkspaceAsAdmin('Locked Workspace', 'patchdev')
    const devToken = await registerAndLogin('developer', 'patchdev')

    const res = await request(app)
      .patch(`/api/workspaces/${workspace.id}`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ name: 'Hacked' })

    expect(res.status).toBe(403)
  })

  test('admin who does not own the workspace receives 403', async () => {
    const { workspace } = await createWorkspaceAsAdmin('Owned Workspace', 'owner')
    const otherAdminToken = await registerAndLogin('admin', 'other')

    const res = await request(app)
      .patch(`/api/workspaces/${workspace.id}`)
      .set('Authorization', `Bearer ${otherAdminToken}`)
      .send({ name: 'Takeover' })

    expect(res.status).toBe(403)
  })

  test('unauthenticated request receives 401', async () => {
    const { workspace } = await createWorkspaceAsAdmin('Auth Test', 'patch401')

    const res = await request(app)
      .patch(`/api/workspaces/${workspace.id}`)
      .send({ name: 'No Auth' })

    expect(res.status).toBe(401)
  })

  test('unknown workspace id receives 404', async () => {
    const token = await registerAndLogin('admin', 'patch404')

    const res = await request(app)
      .patch('/api/workspaces/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' })

    expect(res.status).toBe(404)
  })

  test('empty patch body receives 400', async () => {
    const { token, workspace } = await createWorkspaceAsAdmin('Validation', 'patch400')

    const res = await request(app)
      .patch(`/api/workspaces/${workspace.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
  })

  test('empty name receives 400', async () => {
    const { token, workspace } = await createWorkspaceAsAdmin('Name Check', 'patchempty')

    const res = await request(app)
      .patch(`/api/workspaces/${workspace.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' })

    expect(res.status).toBe(400)
  })
})
