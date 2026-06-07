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
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123',
        role: 'admin',
      })
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' })

    const res = await request(app)
      .get('/api/auth/jira/oauth/start')
      .set('Authorization', `Bearer ${login.body.token}`)

    expect(res.status).toBe(403)
  })
})

describe('GET /api/auth/jira/oauth/callback', () => {
  test('stores OAuth tokens and redirects with success', async () => {
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

    const siteUrl = config.jira.siteUrl
    nock('https://api.atlassian.com')
      .get('/oauth/token/accessible-resources')
      .reply(200, siteUrl ? [{ id: 'cloud-1', url: siteUrl }] : [])

    const res = await request(app)
      .get(`/api/auth/jira/oauth/callback?code=auth-code&state=${encodeURIComponent(state)}`)
      .expect(302)

    expect(res.headers.location).toContain('/dashboard')
    expect(res.headers.location).toContain('jira_oauth=success')

    const row = await db('users').where({ id: user.id }).first()
    expect(row.jira_access_token).toBe('oauth-access-token')
    expect(row.jira_refresh_token).toBe('oauth-refresh-token')
    expect(row.jira_account_id).toBe('atlassian-account-123')
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
