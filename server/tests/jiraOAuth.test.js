require('dotenv').config()

process.env.ATLASSIAN_CLIENT_ID = 'test-atlassian-client-id'
process.env.ATLASSIAN_CLIENT_SECRET = 'test-atlassian-client-secret'
process.env.ATLASSIAN_OAUTH_CALLBACK_URL =
  'http://localhost:3001/api/auth/jira/oauth/callback'

const nock = require('nock')
const request = require('supertest')
const jwt = require('jsonwebtoken')
const config = require('../config')
const createApp = require('../app')
const db = require('../config/db')
const { createOAuthState } = require('../controllers/jiraOAuth')

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  nock.cleanAll()
  await db('user_jira_oauth_pending').del().catch(() => {})
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

async function registerDeveloper(suffix = '') {
  const email = `dev${suffix}@test.com`
  await request(app)
    .post('/api/auth/register')
    .send({ email, username: `dev${suffix}`, password: 'password123', role: 'developer' })
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' })
  return { token: res.body.token, user: res.body.user }
}

describe('GET /api/auth/jira/oauth/status', () => {
  test('returns available when OAuth env is configured', async () => {
    const { token } = await registerDeveloper('oauth-status')

    const res = await request(app)
      .get('/api/auth/jira/oauth/status')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.available).toBe(true)
  })
})

describe('GET /api/auth/jira/oauth/start', () => {
  test('returns authorize URL for developers', async () => {
    const { token, user } = await registerDeveloper('oauth-start')

    const res = await request(app)
      .get('/api/auth/jira/oauth/start?return_to=/profile')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.authorize_url).toContain('https://auth.atlassian.com/authorize')
    expect(res.body.authorize_url).toContain('client_id=test-atlassian-client-id')
    expect(res.body.state).toBeTruthy()

    const payload = jwt.verify(res.body.state, config.jwt.secret)
    expect(payload.sub).toBe(user.id)
    expect(payload.returnTo).toBe('/profile')
  })

  test('rejects non-developer roles', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin-oauth-role@test.com',
        username: 'adminoauthrole',
        password: 'password123',
        role: 'admin',
      })
    await db('users').where({ email: 'admin-oauth-role@test.com' }).update({ role: 'admin' })
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin-oauth-role@test.com', password: 'password123' })

    const res = await request(app)
      .get('/api/auth/jira/oauth/start')
      .set('Authorization', `Bearer ${login.body.token}`)

    expect(res.status).toBe(403)
  })
})

describe('GET /api/auth/jira/oauth/callback', () => {
  test('parks a pending session instead of finalizing connect', async () => {
    const { user } = await registerDeveloper('oauth-callback')
    const state = createOAuthState(user.id, '/dashboard')

    nock('https://auth.atlassian.com')
      .post('/oauth/token')
      .reply(200, {
        access_token: 'oauth-access-token',
        refresh_token: 'oauth-refresh-token',
        expires_in: 3600,
        scope: 'read:jira-work',
      })

    nock('https://api.atlassian.com')
      .get('/me')
      .reply(200, {
        account_id: 'atlassian-account-123',
        email: 'devoauth-callback@test.com',
      })

    const res = await request(app)
      .get(`/api/auth/jira/oauth/callback?code=auth-code&state=${encodeURIComponent(state)}`)
      .expect(302)

    expect(res.headers.location).toContain('/dashboard')
    expect(res.headers.location).toContain('jira_oauth=pending')

    const row = await db('users').where({ id: user.id }).first()
    expect(row.jira_access_token).toBeNull()

    const pending = await db('user_jira_oauth_pending').where({ user_id: user.id }).first()
    expect(pending).toBeTruthy()
  })

  test('redirects when Atlassian account email mismatches Questly user', async () => {
    const { user } = await registerDeveloper('oauth-wrong-email')
    const state = createOAuthState(user.id, '/dashboard')

    nock('https://auth.atlassian.com')
      .post('/oauth/token')
      .reply(200, {
        access_token: 'oauth-access-token',
        refresh_token: 'oauth-refresh-token',
      })

    nock('https://api.atlassian.com')
      .get('/me')
      .reply(200, {
        account_id: 'atlassian-account-123',
        email: 'someone-else@test.com',
      })

    const res = await request(app)
      .get(`/api/auth/jira/oauth/callback?code=auth-code&state=${encodeURIComponent(state)}`)
      .expect(302)

    expect(res.headers.location).toContain('jira_oauth=error')
    expect(res.headers.location).toContain('jira_oauth_reason=wrong_account')

    const row = await db('users').where({ id: user.id }).first()
    expect(row.jira_access_token).toBeNull()
  })

  test('redirects when user denies consent', async () => {
    const { user } = await registerDeveloper('oauth-denied')
    const state = createOAuthState(user.id, '/profile')

    const res = await request(app)
      .get(
        `/api/auth/jira/oauth/callback?error=access_denied&state=${encodeURIComponent(state)}`,
      )
      .expect(302)

    expect(res.headers.location).toContain('/profile')
    expect(res.headers.location).toContain('jira_oauth_reason=denied')
  })
})

async function seedDeveloperPending(user, email) {
  const state = createOAuthState(user.id, '/settings')
  nock('https://auth.atlassian.com')
    .post('/oauth/token')
    .reply(200, {
      access_token: 'dev-pending-access',
      refresh_token: 'dev-pending-refresh',
      expires_in: 3600,
    })
  nock('https://api.atlassian.com')
    .get('/me')
    .reply(200, { account_id: 'atlassian-dev-1', email })
  await request(app)
    .get(`/api/auth/jira/oauth/callback?code=auth-code&state=${encodeURIComponent(state)}`)
    .expect(302)
}

describe('developer pending OAuth confirm (T5)', () => {
  test('locked confirm when team site exists', async () => {
    const { token: adminToken } = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin-t5-locked@test.com',
        username: 'admint5locked',
        password: 'password123',
        role: 'admin',
      })
      .then(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'admin-t5-locked@test.com', password: 'password123' }),
      )
      .then((res) => ({ token: res.body.token }))

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Locked Team' })
    const workspace = wsRes.body.workspace

    const WorkspaceModel = require('../models/workspace')
    await WorkspaceModel.connectJiraOAuth(workspace.id, {
      jira_site_url: 'https://team.atlassian.net',
      jira_project_key: 'TEAM',
      jira_access_token: 'ws-access',
      jira_refresh_token: 'ws-refresh',
      jira_cloud_id: 'cloud-team',
    })

    const { token, user } = await registerDeveloper('t5-locked')
    await db('users').where({ id: user.id }).update({ workspace_id: workspace.id })

    await seedDeveloperPending(user, 'devt5-locked@test.com')

    nock('https://api.atlassian.com')
      .get('/oauth/token/accessible-resources')
      .twice()
      .reply(200, [
        { id: 'cloud-other', url: 'https://other.atlassian.net', name: 'Other' },
        { id: 'cloud-team', url: 'https://team.atlassian.net', name: 'Team' },
      ])
      .get('/me')
      .reply(200, { account_id: 'atlassian-dev-1', email: 'devt5-locked@test.com' })

    const listRes = await request(app)
      .get('/api/auth/jira/oauth/pending/sites')
      .set('Authorization', `Bearer ${token}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body.site_locked).toBe(true)
    expect(listRes.body.sites).toHaveLength(1)
    expect(listRes.body.sites[0].url).toBe('https://team.atlassian.net')

    const rejectRes = await request(app)
      .post('/api/auth/jira/oauth/pending/site')
      .set('Authorization', `Bearer ${token}`)
      .send({ site_url: 'https://other.atlassian.net' })
    expect(rejectRes.status).toBe(400)

    const confirmRes = await request(app)
      .post('/api/auth/jira/oauth/pending/site')
      .set('Authorization', `Bearer ${token}`)
      .send({ site_url: 'https://team.atlassian.net' })

    expect(confirmRes.status).toBe(200)
    expect(confirmRes.body.confirmed_site_url).toBe('https://team.atlassian.net')

    const row = await db('users').where({ id: user.id }).first()
    expect(row.jira_account_id).toBe('atlassian-dev-1')
    expect(row.jira_site_url).toBe('https://team.atlassian.net')
    expect(row.jira_access_token).toBeTruthy()

    const pending = await db('user_jira_oauth_pending').where({ user_id: user.id }).first()
    expect(pending).toBeFalsy()
  })

  test('free site picker when no team site', async () => {
    const { token, user } = await registerDeveloper('t5-free')
    await seedDeveloperPending(user, 'devt5-free@test.com')

    nock('https://api.atlassian.com')
      .get('/oauth/token/accessible-resources')
      .twice()
      .reply(200, [
        { id: 'cloud-a', url: 'https://alpha.atlassian.net', name: 'Alpha' },
        { id: 'cloud-b', url: 'https://beta.atlassian.net', name: 'Beta' },
      ])
      .get('/me')
      .reply(200, { account_id: 'atlassian-dev-free', email: 'devt5-free@test.com' })

    const listRes = await request(app)
      .get('/api/auth/jira/oauth/pending/sites')
      .set('Authorization', `Bearer ${token}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body.site_locked).toBe(false)
    expect(listRes.body.sites).toHaveLength(2)

    const confirmRes = await request(app)
      .post('/api/auth/jira/oauth/pending/site')
      .set('Authorization', `Bearer ${token}`)
      .send({ site_url: 'https://beta.atlassian.net' })

    expect(confirmRes.status).toBe(200)
    expect(confirmRes.body.confirmed_site_url).toBe('https://beta.atlassian.net')

    const row = await db('users').where({ id: user.id }).first()
    expect(row.jira_site_url).toBe('https://beta.atlassian.net')
  })

  test('me reports personal_jira_site_mismatch after joining a different team site', async () => {
    const { token, user } = await registerDeveloper('t5-mismatch')
    await db('users').where({ id: user.id }).update({
      jira_access_token: 'enc-token',
      jira_account_id: 'acct-1',
      jira_site_url: 'https://personal.atlassian.net',
    })

    const { token: adminToken } = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin-t5-mm@test.com',
        username: 'admint5mm',
        password: 'password123',
        role: 'admin',
      })
      .then(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'admin-t5-mm@test.com', password: 'password123' }),
      )
      .then((res) => ({ token: res.body.token }))

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Mismatch Team' })
    const WorkspaceModel = require('../models/workspace')
    await WorkspaceModel.connectJiraOAuth(wsRes.body.workspace.id, {
      jira_site_url: 'https://team.atlassian.net',
      jira_project_key: 'TEAM',
      jira_access_token: 'ws-access',
      jira_refresh_token: 'ws-refresh',
      jira_cloud_id: 'cloud-team',
    })
    await db('users').where({ id: user.id }).update({ workspace_id: wsRes.body.workspace.id })

    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(meRes.status).toBe(200)
    expect(meRes.body.user.personal_jira_site_mismatch).toBe(true)
    expect(meRes.body.user.expected_jira_site_url).toBe('https://team.atlassian.net')
  })
})
