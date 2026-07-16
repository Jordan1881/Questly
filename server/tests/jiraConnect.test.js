require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const jiraClient = require('../services/jiraClient')

jest.mock('../services/jiraClient', () => ({
  ...jest.requireActual('../services/jiraClient'),
  validateCredentials: jest.fn(),
}))

const { isEncrypted, decryptToken } = require('../lib/jiraTokenCrypto')

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  jest.clearAllMocks()
  jiraClient.validateCredentials.mockResolvedValue({ accountId: 'jira-acct-1' })
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
  return { token: res.body.token, user: res.body.user }
}

async function createWorkspaceAsAdmin(suffix = '') {
  const { token, user } = await registerAndLogin('admin', suffix)
  const res = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: `Workspace ${suffix}` })
  return { token, workspace: res.body.workspace, adminUser: user }
}

const CONNECT_BODY = {
  jira_site_url: 'https://acme.atlassian.net',
  jira_project_key: 'QUEST',
  access_token: 'admin-jira-token',
}

describe('POST /api/workspaces/:id/jira/connect', () => {
  test('workspace admin stores Jira credentials and returns sanitized workspace', async () => {
    const { token, workspace } = await createWorkspaceAsAdmin('connect')

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/connect`)
      .set('Authorization', `Bearer ${token}`)
      .send(CONNECT_BODY)

    expect(res.status).toBe(200)
    expect(res.body.workspace).toMatchObject({
      id: workspace.id,
      jira_site_url: 'https://acme.atlassian.net',
      jira_project_key: 'QUEST',
      jira_connected: true,
    })
    expect(res.body.workspace.jira_access_token).toBeUndefined()

    const row = await db('workspaces').where({ id: workspace.id }).first()
    expect(isEncrypted(row.jira_access_token)).toBe(true)
    expect(decryptToken(row.jira_access_token)).toBe('admin-jira-token')
    expect(jiraClient.validateCredentials).toHaveBeenCalledWith({
      siteUrl: CONNECT_BODY.jira_site_url,
      email: 'adminconnect@test.com',
      apiToken: CONNECT_BODY.access_token,
      projectKey: CONNECT_BODY.jira_project_key,
    })
  })

  test('missing fields receive 400', async () => {
    const { token, workspace } = await createWorkspaceAsAdmin('connect400')

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/connect`)
      .set('Authorization', `Bearer ${token}`)
      .send({ jira_site_url: 'https://acme.atlassian.net' })

    expect(res.status).toBe(400)
  })

  test('invalid Jira credentials receive 400', async () => {
    jiraClient.validateCredentials.mockRejectedValueOnce(
      Object.assign(new Error('Unauthorized'), { status: 401 }),
    )
    const { token, workspace } = await createWorkspaceAsAdmin('connectbad')

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/connect`)
      .set('Authorization', `Bearer ${token}`)
      .send(CONNECT_BODY)

    expect(res.status).toBe(400)
  })

  test('developer receives 403', async () => {
    const { workspace } = await createWorkspaceAsAdmin('connect403')
    const { token: devToken } = await registerAndLogin('developer', 'connect403')

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/connect`)
      .set('Authorization', `Bearer ${devToken}`)
      .send(CONNECT_BODY)

    expect(res.status).toBe(403)
  })

  test('unauthenticated request receives 401', async () => {
    const { workspace } = await createWorkspaceAsAdmin('connect401')

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/connect`)
      .send(CONNECT_BODY)

    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/workspaces/:id/jira/disconnect', () => {
  test('workspace admin clears stored Jira credentials', async () => {
    const { token, workspace } = await createWorkspaceAsAdmin('disconnect')
    await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/connect`)
      .set('Authorization', `Bearer ${token}`)
      .send(CONNECT_BODY)

    const res = await request(app)
      .delete(`/api/workspaces/${workspace.id}/jira/disconnect`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.workspace.jira_connected).toBe(false)
    expect(res.body.workspace.jira_site_url).toBeNull()
    expect(res.body.workspace.jira_project_key).toBeNull()

    const row = await db('workspaces').where({ id: workspace.id }).first()
    expect(row.jira_access_token).toBeNull()
  })

  test('non-owner admin receives 403', async () => {
    const { workspace } = await createWorkspaceAsAdmin('disconnect403')
    const { token: otherToken } = await registerAndLogin('admin', 'other')

    const res = await request(app)
      .delete(`/api/workspaces/${workspace.id}/jira/disconnect`)
      .set('Authorization', `Bearer ${otherToken}`)

    expect(res.status).toBe(403)
  })
})

describe('POST /api/auth/me/jira/connect', () => {
  test('developer stores personal Jira credentials', async () => {
    const { token: adminToken, workspace } = await createWorkspaceAsAdmin('devconnect')
    await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/connect`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(CONNECT_BODY)

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'devconnect')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    const res = await request(app)
      .post('/api/auth/me/jira/connect')
      .set('Authorization', `Bearer ${devToken}`)
      .send({ access_token: 'dev-jira-token' })

    expect(res.status).toBe(200)
    expect(res.body.user.jira_connected).toBe(true)
    expect(res.body.user.jira_access_token).toBeUndefined()
    expect(res.body.user.jira_account_id).toBeUndefined()

    const row = await db('users').where({ id: devUser.id }).first()
    expect(isEncrypted(row.jira_access_token)).toBe(true)
    expect(decryptToken(row.jira_access_token)).toBe('dev-jira-token')
    expect(row.jira_account_id).toBe('jira-acct-1')
  })

  test('missing access_token receives 400', async () => {
    const { token } = await registerAndLogin('developer', 'dev400')

    const res = await request(app)
      .post('/api/auth/me/jira/connect')
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
  })

  test('invalid Jira credentials receive readable 400 message', async () => {
    const { token: adminToken, workspace } = await createWorkspaceAsAdmin('devbad')
    jiraClient.validateCredentials
      .mockResolvedValueOnce({ accountId: 'jira-acct-1' })
      .mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { status: 401 }))

    await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/connect`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(CONNECT_BODY)

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'devbad')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    const res = await request(app)
      .post('/api/auth/me/jira/connect')
      .set('Authorization', `Bearer ${devToken}`)
      .send({ access_token: 'bad-token' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/acme\.atlassian\.net/i)
    expect(res.body.error).not.toMatch(/HTTP 401/)
  })

  test('developer without workspace receives 400 with join-first message', async () => {
    const { token } = await registerAndLogin('developer', 'noworkspace')

    const res = await request(app)
      .post('/api/auth/me/jira/connect')
      .set('Authorization', `Bearer ${token}`)
      .send({ access_token: 'dev-jira-token' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Join a team first/i)
    expect(jiraClient.validateCredentials).not.toHaveBeenCalled()
  })

  test('unauthenticated request receives 401', async () => {
    const res = await request(app)
      .post('/api/auth/me/jira/connect')
      .send({ access_token: 'token' })

    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/auth/me/jira/disconnect', () => {
  test('developer clears personal Jira credentials', async () => {
    const { token: adminToken, workspace } = await createWorkspaceAsAdmin('devdisc')
    await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/connect`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(CONNECT_BODY)

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'devdisc')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    await request(app)
      .post('/api/auth/me/jira/connect')
      .set('Authorization', `Bearer ${devToken}`)
      .send({ access_token: 'dev-jira-token' })

    const res = await request(app)
      .delete('/api/auth/me/jira/disconnect')
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(200)
    expect(res.body.user.jira_connected).toBe(false)

    const row = await db('users').where({ id: devUser.id }).first()
    expect(row.jira_access_token).toBeNull()
    expect(row.jira_account_id).toBeNull()
  })
})

describe('Jira token encryption at rest', () => {
  const savedKey = process.env.JIRA_TOKEN_ENCRYPTION_KEY

  beforeEach(() => {
    process.env.JIRA_TOKEN_ENCRYPTION_KEY = 'test-encryption-secret'
  })

  afterEach(() => {
    if (savedKey === undefined) delete process.env.JIRA_TOKEN_ENCRYPTION_KEY
    else process.env.JIRA_TOKEN_ENCRYPTION_KEY = savedKey
  })

  test('workspace connect stores encrypted token and decrypts for Jira API calls', async () => {
    const { token, workspace } = await createWorkspaceAsAdmin('encws')

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/connect`)
      .set('Authorization', `Bearer ${token}`)
      .send(CONNECT_BODY)

    expect(res.status).toBe(200)

    const row = await db('workspaces').where({ id: workspace.id }).first()
    expect(isEncrypted(row.jira_access_token)).toBe(true)
    expect(decryptToken(row.jira_access_token)).toBe(CONNECT_BODY.access_token)
    expect(jiraClient.validateCredentials).toHaveBeenCalledWith({
      siteUrl: CONNECT_BODY.jira_site_url,
      email: 'adminencws@test.com',
      apiToken: CONNECT_BODY.access_token,
      projectKey: CONNECT_BODY.jira_project_key,
    })
  })

  test('developer connect stores encrypted token and decrypts for Jira API calls', async () => {
    const { token: adminToken, workspace } = await createWorkspaceAsAdmin('encdev')
    await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/connect`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(CONNECT_BODY)

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'encdev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    const res = await request(app)
      .post('/api/auth/me/jira/connect')
      .set('Authorization', `Bearer ${devToken}`)
      .send({ access_token: 'dev-jira-token' })

    expect(res.status).toBe(200)

    const row = await db('users').where({ id: devUser.id }).first()
    expect(isEncrypted(row.jira_access_token)).toBe(true)
    expect(decryptToken(row.jira_access_token)).toBe('dev-jira-token')
    expect(jiraClient.validateCredentials).toHaveBeenLastCalledWith({
      siteUrl: CONNECT_BODY.jira_site_url,
      email: 'devencdev@test.com',
      apiToken: 'dev-jira-token',
    })
  })
})

describe('GET /api/auth/me', () => {
  test('includes jira_connected flag without exposing tokens', async () => {
    const { token: adminToken, workspace } = await createWorkspaceAsAdmin('me')
    await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/connect`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(CONNECT_BODY)

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'me')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })
    await request(app)
      .post('/api/auth/me/jira/connect')
      .set('Authorization', `Bearer ${devToken}`)
      .send({ access_token: 'dev-jira-token' })

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(200)
    expect(res.body.user.jira_connected).toBe(true)
    expect(res.body.user.jira_access_token).toBeUndefined()
    expect(res.body.user.expected_jira_site_url).toBe('https://acme.atlassian.net')
    expect(res.body.user.team_jira_site_host).toBe('acme.atlassian.net')
    expect(res.body.user.team_jira_connected).toBe(true)
  })
})
