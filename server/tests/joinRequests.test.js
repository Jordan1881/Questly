require('dotenv').config()
const request = require('supertest')
const jiraClient = require('../services/jiraClient')
const createApp = require('../app')
const db = require('../config/db')

jest.mock('../services/jiraClient', () => ({
  ...jest.requireActual('../services/jiraClient'),
  lookupAccountIdByEmail: jest.fn().mockResolvedValue(null),
}))

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  jest.clearAllMocks()
  jiraClient.lookupAccountIdByEmail.mockResolvedValue(null)
  delete process.env.JIRA_DEVELOPER_EMAIL
  delete process.env.JIRA_DEVELOPER_ACCOUNT_ID
  delete process.env.JIRA_ACCOUNT_ID
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

async function createWorkspaceAsAdmin(name = 'Acme Corp', suffix = '') {
  const { token } = await registerAndLogin('admin', suffix)
  const res = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${token}`)
    .send({ name })
  return { token, workspace: res.body.workspace }
}

describe('GET /api/workspaces/:id/members', () => {
  test('workspace admin lists approved members', async () => {
    const { token, workspace } = await createWorkspaceAsAdmin('Members Co', 'members')
    const { token: devToken } = await registerAndLogin('developer', 'member1')
    const devUser = await db('users').where({ email: 'devmember1@test.com' }).first()
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    const res = await request(app)
      .get(`/api/workspaces/${workspace.id}/members`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.members).toHaveLength(1)
    expect(res.body.members[0]).toMatchObject({
      id: devUser.id,
      username: 'devmember1',
      workspace_id: workspace.id,
    })
  })

  test('developer receives 403', async () => {
    const { workspace } = await createWorkspaceAsAdmin('Locked', 'memdev')
    const { token: devToken } = await registerAndLogin('developer', 'memdev')

    const res = await request(app)
      .get(`/api/workspaces/${workspace.id}/members`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(403)
  })
})

describe('join request flow', () => {
  test('submit → list pending → approve → member access granted', async () => {
    const { token: adminToken, workspace } = await createWorkspaceAsAdmin('Flow Co', 'flow')
    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'flow')

    const submitRes = await request(app)
      .post(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({})

    expect(submitRes.status).toBe(201)
    expect(submitRes.body.join_request).toMatchObject({
      user_id: devUser.id,
      workspace_id: workspace.id,
      status: 'pending',
    })

    const listRes = await request(app)
      .get(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body.join_requests).toHaveLength(1)
    expect(listRes.body.join_requests[0].username).toBe('devflow')

    const approveRes = await request(app)
      .patch(`/api/workspaces/${workspace.id}/join-requests/${submitRes.body.join_request.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' })

    expect(approveRes.status).toBe(200)
    expect(approveRes.body.join_request.status).toBe('approved')

    const membersRes = await request(app)
      .get(`/api/workspaces/${workspace.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(membersRes.body.members).toHaveLength(1)

    const accessRes = await request(app)
      .get(`/api/workspaces/${workspace.id}`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(accessRes.status).toBe(200)
  })

  test('approve sets jira_account_id when developer email matches env', async () => {
    process.env.JIRA_DEVELOPER_EMAIL = 'devflow@test.com'
    process.env.JIRA_DEVELOPER_ACCOUNT_ID = 'jira-account-flow'

    const { token: adminToken, workspace } = await createWorkspaceAsAdmin('Jira Co', 'jira')
    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'flow')

    const submitRes = await request(app)
      .post(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({})

    const approveRes = await request(app)
      .patch(`/api/workspaces/${workspace.id}/join-requests/${submitRes.body.join_request.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' })

    expect(approveRes.status).toBe(200)

    const devRow = await db('users').where({ id: devUser.id }).first()
    expect(devRow.workspace_id).toBe(workspace.id)
    expect(devRow.jira_account_id).toBe('jira-account-flow')
  })

  test('developer with workspace cannot submit another join request', async () => {
    const { workspace } = await createWorkspaceAsAdmin('Taken', 'taken')
    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'taken')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({})

    expect(res.status).toBe(400)
  })

  test('duplicate pending join request returns 409', async () => {
    const { workspace } = await createWorkspaceAsAdmin('Dup', 'dup')
    const { token: devToken } = await registerAndLogin('developer', 'dup')

    await request(app)
      .post(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({})

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({})

    expect(res.status).toBe(409)
  })

  test('admin can reject a join request without assigning workspace', async () => {
    const { token: adminToken, workspace } = await createWorkspaceAsAdmin('Reject Co', 'reject')
    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'reject')

    const submitRes = await request(app)
      .post(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({})

    const rejectRes = await request(app)
      .patch(`/api/workspaces/${workspace.id}/join-requests/${submitRes.body.join_request.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' })

    expect(rejectRes.status).toBe(200)
    expect(rejectRes.body.join_request.status).toBe('rejected')

    const user = await db('users').where({ id: devUser.id }).first()
    expect(user.workspace_id).toBeNull()
  })

  test('GET /api/join-requests/me returns pending request for developer', async () => {
    const { workspace } = await createWorkspaceAsAdmin('Mine Co', 'mine')
    const { token: devToken } = await registerAndLogin('developer', 'mine')

    await request(app)
      .post(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({})

    const res = await request(app)
      .get('/api/join-requests/me')
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(200)
    expect(res.body.join_request.status).toBe('pending')
  })

  test('GET /api/workspaces/by-code/:code resolves workspace', async () => {
    const { workspace } = await createWorkspaceAsAdmin('Code Co', 'code')
    const { token: devToken } = await registerAndLogin('developer', 'code')

    const res = await request(app)
      .get(`/api/workspaces/by-code/${workspace.code}`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(200)
    expect(res.body.workspace).toMatchObject({
      id: workspace.id,
      name: 'Code Co',
      code: workspace.code,
    })
  })
})
