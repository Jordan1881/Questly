require('dotenv').config()

process.env.ATLASSIAN_CLIENT_ID = 'test-atlassian-client-id'
process.env.ATLASSIAN_CLIENT_SECRET = 'test-atlassian-client-secret'
process.env.ATLASSIAN_OAUTH_CALLBACK_URL =
  'http://localhost:3001/api/auth/jira/oauth/callback'
process.env.ATLASSIAN_WORKSPACE_OAUTH_CALLBACK_URL =
  'http://localhost:3001/api/workspaces/jira/oauth/callback'

const nock = require('nock')
const request = require('supertest')
const jwt = require('jsonwebtoken')
const config = require('../config')
const createApp = require('../app')
const db = require('../config/db')
const { createOAuthState } = require('../controllers/workspaceJiraOAuth')
const { isEncrypted } = require('../lib/jiraTokenCrypto')

const app = createApp()

jest.setTimeout(30000)

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  nock.cleanAll()
  await db('jira_oauth_pending').del()
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

describe('GET /api/workspaces/jira/oauth/status', () => {
  test('returns available when workspace OAuth callback is configured', async () => {
    const { token } = await createWorkspaceAsAdmin('ws-oauth-status')

    const res = await request(app)
      .get('/api/workspaces/jira/oauth/status')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.available).toBe(true)
  })
})

describe('GET /api/workspaces/:id/jira/oauth/start', () => {
  test('returns authorize URL for workspace admin without site or project', async () => {
    const { token, workspace, adminUser } = await createWorkspaceAsAdmin('ws-oauth-start')

    const res = await request(app)
      .get(`/api/workspaces/${workspace.id}/jira/oauth/start?return_to=/admin`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.authorize_url).toContain('https://auth.atlassian.com/authorize')
    expect(res.body.authorize_url).toContain(
      encodeURIComponent('http://localhost:3001/api/workspaces/jira/oauth/callback'),
    )

    const payload = jwt.verify(res.body.state, config.jwt.secret)
    expect(payload.sub).toBe(adminUser.id)
    expect(payload.workspaceId).toBe(workspace.id)
    expect(payload.jiraSiteUrl == null || payload.jiraSiteUrl === '').toBe(true)
    expect(payload.jiraProjectKey == null || payload.jiraProjectKey === '').toBe(true)
  })

  test('rejects non-admin users', async () => {
    const { workspace } = await createWorkspaceAsAdmin('ws-oauth-403')
    const { token: devToken } = await registerAndLogin('developer', 'ws-oauth-403')

    const res = await request(app)
      .get(`/api/workspaces/${workspace.id}/jira/oauth/start`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(403)
  })
})

describe('GET /api/workspaces/jira/oauth/callback', () => {
  test('exchanges code but does not finalize workspace Jira connect', async () => {
    const { workspace, adminUser } = await createWorkspaceAsAdmin('ws-oauth-cb')
    const state = createOAuthState({
      userId: adminUser.id,
      workspaceId: workspace.id,
      returnTo: '/admin',
    })

    nock('https://auth.atlassian.com')
      .post('/oauth/token')
      .reply(200, {
        access_token: 'workspace-oauth-access',
        refresh_token: 'workspace-oauth-refresh',
        expires_in: 3600,
      })

    nock('https://api.atlassian.com')
      .get('/me')
      .reply(200, {
        account_id: 'atlassian-admin-123',
        email: 'adminws-oauth-cb@test.com',
      })

    const res = await request(app)
      .get(`/api/workspaces/jira/oauth/callback?code=auth-code&state=${encodeURIComponent(state)}`)
      .expect(302)

    expect(res.headers.location).toContain('/admin')
    expect(res.headers.location).toContain('workspace_jira_oauth=pending')

    const row = await db('workspaces').where({ id: workspace.id }).first()
    expect(row.jira_access_token).toBeNull()
    expect(row.jira_refresh_token).toBeNull()
    expect(row.jira_site_url).toBeNull()
    expect(row.jira_project_key).toBeNull()
    expect(row.jira_cloud_id).toBeNull()
  })

  test('redirects when admin email mismatches Questly account', async () => {
    const { workspace, adminUser } = await createWorkspaceAsAdmin('ws-wrong-email')
    const state = createOAuthState({
      userId: adminUser.id,
      workspaceId: workspace.id,
      returnTo: '/admin',
    })

    nock('https://auth.atlassian.com')
      .post('/oauth/token')
      .reply(200, {
        access_token: 'workspace-oauth-access',
        refresh_token: 'workspace-oauth-refresh',
      })

    nock('https://api.atlassian.com')
      .get('/me')
      .reply(200, {
        account_id: 'atlassian-admin-123',
        email: 'someone-else@test.com',
      })

    const res = await request(app)
      .get(`/api/workspaces/jira/oauth/callback?code=auth-code&state=${encodeURIComponent(state)}`)
      .expect(302)

    expect(res.headers.location).toContain('workspace_jira_oauth=error')
    expect(res.headers.location).toContain('workspace_jira_oauth_reason=wrong_account')

    const row = await db('workspaces').where({ id: workspace.id }).first()
    expect(row.jira_access_token).toBeNull()
  })
})


async function seedPendingViaCallback(adminUser, workspace, email) {
  const state = createOAuthState({
    userId: adminUser.id,
    workspaceId: workspace.id,
    returnTo: '/admin',
  })
  nock('https://auth.atlassian.com')
    .post('/oauth/token')
    .reply(200, {
      access_token: 'workspace-oauth-access',
      refresh_token: 'workspace-oauth-refresh',
    })
  nock('https://api.atlassian.com')
    .get('/me')
    .reply(200, { account_id: 'atlassian-admin-123', email })
  await request(app)
    .get(`/api/workspaces/jira/oauth/callback?code=auth-code&state=${encodeURIComponent(state)}`)
    .expect(302)
}

describe('pending OAuth session', () => {
  test('callback parks encrypted tokens in a pending session', async () => {
    const { workspace, adminUser } = await createWorkspaceAsAdmin('ws-pending-cb')
    const state = createOAuthState({
      userId: adminUser.id,
      workspaceId: workspace.id,
      returnTo: '/admin',
    })

    nock('https://auth.atlassian.com')
      .post('/oauth/token')
      .reply(200, {
        access_token: 'workspace-oauth-access',
        refresh_token: 'workspace-oauth-refresh',
        expires_in: 3600,
      })

    nock('https://api.atlassian.com')
      .get('/me')
      .reply(200, {
        account_id: 'atlassian-admin-123',
        email: 'adminws-pending-cb@test.com',
      })

    const res = await request(app)
      .get(`/api/workspaces/jira/oauth/callback?code=auth-code&state=${encodeURIComponent(state)}`)
      .expect(302)

    expect(res.headers.location).toContain('workspace_jira_oauth=pending')

    const row = await db('jira_oauth_pending')
      .where({ user_id: adminUser.id, workspace_id: workspace.id })
      .first()
    expect(row).toBeTruthy()
    const expiresMs = new Date(row.expires_at).getTime() - Date.now()
    expect(expiresMs).toBeGreaterThan(14 * 60 * 1000)
    expect(expiresMs).toBeLessThanOrEqual(15 * 60 * 1000 + 5000)
    expect(isEncrypted(row.access_token)).toBe(true)
    expect(isEncrypted(row.refresh_token)).toBe(true)

    const ws = await db('workspaces').where({ id: workspace.id }).first()
    expect(ws.jira_access_token).toBeNull()
  })

  test('GET pending returns metadata without tokens; DELETE cancels', async () => {
    const { token, workspace, adminUser } = await createWorkspaceAsAdmin('ws-pending-api')
    const state = createOAuthState({
      userId: adminUser.id,
      workspaceId: workspace.id,
      returnTo: '/admin',
    })

    nock('https://auth.atlassian.com')
      .post('/oauth/token')
      .reply(200, {
        access_token: 'workspace-oauth-access',
        refresh_token: 'workspace-oauth-refresh',
      })
    nock('https://api.atlassian.com')
      .get('/me')
      .reply(200, {
        account_id: 'atlassian-admin-123',
        email: 'adminws-pending-api@test.com',
      })

    await request(app)
      .get(`/api/workspaces/jira/oauth/callback?code=auth-code&state=${encodeURIComponent(state)}`)
      .expect(302)

    const getRes = await request(app)
      .get(`/api/workspaces/${workspace.id}/jira/oauth/pending`)
      .set('Authorization', `Bearer ${token}`)

    expect(getRes.status).toBe(200)
    expect(getRes.body.pending).toBe(true)
    expect(getRes.body.expires_at).toBeTruthy()
    expect(getRes.body.access_token).toBeUndefined()
    expect(getRes.body.refresh_token).toBeUndefined()

    const delRes = await request(app)
      .delete(`/api/workspaces/${workspace.id}/jira/oauth/pending`)
      .set('Authorization', `Bearer ${token}`)
    expect(delRes.status).toBe(204)

    const gone = await db('jira_oauth_pending')
      .where({ user_id: adminUser.id, workspace_id: workspace.id })
      .first()
    expect(gone).toBeFalsy()

    const delAgain = await request(app)
      .delete(`/api/workspaces/${workspace.id}/jira/oauth/pending`)
      .set('Authorization', `Bearer ${token}`)
    expect(delAgain.status).toBe(204)

    const getGone = await request(app)
      .get(`/api/workspaces/${workspace.id}/jira/oauth/pending`)
      .set('Authorization', `Bearer ${token}`)
    expect(getGone.status).toBe(404)
  })

  test('expired pending session is not usable', async () => {
    const { token, workspace, adminUser } = await createWorkspaceAsAdmin('ws-pending-exp')
    const JiraOAuthPending = require('../models/jiraOAuthPending')
    await JiraOAuthPending.upsert({
      userId: adminUser.id,
      workspaceId: workspace.id,
      accessToken: 'stale-access',
      refreshToken: 'stale-refresh',
      expiresAt: new Date(Date.now() - 60_000),
    })

    const getRes = await request(app)
      .get(`/api/workspaces/${workspace.id}/jira/oauth/pending`)
      .set('Authorization', `Bearer ${token}`)

    expect(getRes.status).toBe(410)
    expect(getRes.body.error).toMatch(/expired/i)

    const row = await db('jira_oauth_pending')
      .where({ user_id: adminUser.id, workspace_id: workspace.id })
      .first()
    expect(row).toBeFalsy()
  })
})

describe('pending OAuth sites (T2)', () => {
  test('lists accessible sites and confirms a site onto the pending session', async () => {
    const { token, workspace, adminUser } = await createWorkspaceAsAdmin('ws-sites')
    await seedPendingViaCallback(adminUser, workspace, 'adminws-sites@test.com')

    // list + confirm each fetch accessible-resources
    nock('https://api.atlassian.com')
      .get('/oauth/token/accessible-resources')
      .twice()
      .reply(200, [
        { id: 'cloud-acme', url: 'https://acme.atlassian.net', name: 'Acme' },
        { id: 'cloud-beta', url: 'https://beta.atlassian.net', name: 'Beta' },
      ])

    const listRes = await request(app)
      .get(`/api/workspaces/${workspace.id}/jira/oauth/pending/sites`)
      .set('Authorization', `Bearer ${token}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body.sites).toHaveLength(2)
    expect(listRes.body.sites[0]).toEqual(
      expect.objectContaining({ id: 'cloud-acme', url: 'https://acme.atlassian.net', name: 'Acme' }),
    )

    const confirmRes = await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/oauth/pending/site`)
      .set('Authorization', `Bearer ${token}`)
      .send({ site_url: 'https://acme.atlassian.net' })

    expect(confirmRes.status).toBe(200)
    expect(confirmRes.body.selected_site_url).toBe('https://acme.atlassian.net')
    expect(confirmRes.body.selected_cloud_id).toBe('cloud-acme')
    expect(confirmRes.body.pending).toBe(true)

    const row = await db('jira_oauth_pending')
      .where({ user_id: adminUser.id, workspace_id: workspace.id })
      .first()
    expect(row.selected_site_url).toBe('https://acme.atlassian.net')
    expect(row.selected_cloud_id).toBe('cloud-acme')

    const ws = await db('workspaces').where({ id: workspace.id }).first()
    expect(ws.jira_site_url).toBeNull()
    expect(ws.jira_access_token).toBeNull()
  })

  test('empty accessible-resources clears pending and returns an error', async () => {
    const { token, workspace, adminUser } = await createWorkspaceAsAdmin('ws-sites-empty')
    await seedPendingViaCallback(adminUser, workspace, 'adminws-sites-empty@test.com')

    nock('https://api.atlassian.com')
      .get('/oauth/token/accessible-resources')
      .reply(200, [])

    const listRes = await request(app)
      .get(`/api/workspaces/${workspace.id}/jira/oauth/pending/sites`)
      .set('Authorization', `Bearer ${token}`)

    expect(listRes.status).toBe(422)
    expect(listRes.body.error).toMatch(/no atlassian sites/i)

    const row = await db('jira_oauth_pending')
      .where({ user_id: adminUser.id, workspace_id: workspace.id })
      .first()
    expect(row).toBeFalsy()
  })
})

async function seedPendingWithSelectedSite(
  adminUser,
  workspace,
  email,
  { siteUrl = 'https://acme.atlassian.net', cloudId = 'cloud-acme' } = {},
) {
  await seedPendingViaCallback(adminUser, workspace, email)
  const JiraOAuthPending = require('../models/jiraOAuthPending')
  await JiraOAuthPending.selectSite(adminUser.id, workspace.id, { siteUrl, cloudId })
}

describe('pending OAuth projects (T3)', () => {
  test('lists projects for the confirmed site and finalizes with one sync', async () => {
    const { token, workspace, adminUser } = await createWorkspaceAsAdmin('ws-projects')
    await seedPendingWithSelectedSite(adminUser, workspace, 'adminws-projects@test.com')

    nock('https://api.atlassian.com')
      .get('/ex/jira/cloud-acme/rest/api/3/project')
      .twice()
      .reply(200, [
        { id: '10000', key: 'QUEST', name: 'Questly' },
        { id: '10001', key: 'OPS', name: 'Operations' },
      ])

    const listRes = await request(app)
      .get(`/api/workspaces/${workspace.id}/jira/oauth/pending/projects`)
      .set('Authorization', `Bearer ${token}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body.projects).toEqual([
      { key: 'QUEST', name: 'Questly' },
      { key: 'OPS', name: 'Operations' },
    ])

    nock('https://auth.atlassian.com')
      .post('/oauth/token')
      .reply(200, {
        access_token: 'fresh-workspace-access',
        refresh_token: 'fresh-workspace-refresh',
        expires_in: 3600,
      })

    nock('https://api.atlassian.com')
      .get('/ex/jira/cloud-acme/rest/api/3/field')
      .reply(200, [{ id: 'customfield_10016', name: 'Story point estimate' }])
      .get('/ex/jira/cloud-acme/rest/api/3/search/jql')
      .query(true)
      .reply(200, {
        issues: [
          {
            id: '20001',
            key: 'QUEST-1',
            fields: {
              summary: 'First quest',
              description: null,
              status: { name: 'To Do' },
              priority: { name: 'Medium' },
              duedate: null,
              customfield_10016: 2,
            },
          },
        ],
      })

    const confirmRes = await request(app)
      .post(`/api/workspaces/${workspace.id}/jira/oauth/pending/project`)
      .set('Authorization', `Bearer ${token}`)
      .send({ project_key: 'QUEST' })

    expect(confirmRes.status).toBe(200)
    expect(confirmRes.body.workspace.jira_connected).toBe(true)
    expect(confirmRes.body.workspace.jira_site_url).toBe('https://acme.atlassian.net')
    expect(confirmRes.body.workspace.jira_project_key).toBe('QUEST')
    expect(confirmRes.body.workspace.jira_access_token).toBeUndefined()
    expect(confirmRes.body.sync).toEqual(
      expect.objectContaining({ synced: 1, created: 1 }),
    )

    const pending = await db('jira_oauth_pending')
      .where({ user_id: adminUser.id, workspace_id: workspace.id })
      .first()
    expect(pending).toBeFalsy()

    const ws = await db('workspaces').where({ id: workspace.id }).first()
    expect(ws.jira_site_url).toBe('https://acme.atlassian.net')
    expect(ws.jira_project_key).toBe('QUEST')
    expect(ws.jira_cloud_id).toBe('cloud-acme')
    expect(ws.jira_auth_type).toBe('oauth')
    expect(ws.jira_access_token).toBeTruthy()
  })

  test('project list requires a confirmed site on the pending session', async () => {
    const { token, workspace, adminUser } = await createWorkspaceAsAdmin('ws-projects-nosite')
    await seedPendingViaCallback(adminUser, workspace, 'adminws-projects-nosite@test.com')

    const listRes = await request(app)
      .get(`/api/workspaces/${workspace.id}/jira/oauth/pending/projects`)
      .set('Authorization', `Bearer ${token}`)

    expect(listRes.status).toBe(400)
    expect(listRes.body.error).toMatch(/site/i)
  })
})
