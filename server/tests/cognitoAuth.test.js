require('dotenv').config()

jest.mock('../services/cognitoAuth', () => {
  process.env.COGNITO_REGION = 'eu-central-1'
  process.env.COGNITO_USER_POOL_ID = 'eu-central-1_TestPool'
  process.env.COGNITO_CLIENT_ID = 'test-cognito-client-id'
  process.env.COGNITO_CLIENT_SECRET = 'test-cognito-client-secret'
  process.env.COGNITO_DOMAIN = 'questly-test.auth.eu-central-1.amazoncognito.com'
  process.env.COGNITO_REDIRECT_URI = 'http://localhost:3001/api/auth/cognito/callback'
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

  const actual = jest.requireActual('../services/cognitoAuth')
  return {
    ...actual,
    isConfigured: jest.fn(() => true),
    exchangeCodeForTokens: jest.fn(),
    verifyIdToken: jest.fn(),
  }
})

process.env.COGNITO_REGION = 'eu-central-1'
process.env.COGNITO_USER_POOL_ID = 'eu-central-1_TestPool'
process.env.COGNITO_CLIENT_ID = 'test-cognito-client-id'
process.env.COGNITO_CLIENT_SECRET = 'test-cognito-client-secret'
process.env.COGNITO_DOMAIN = 'questly-test.auth.eu-central-1.amazoncognito.com'
process.env.COGNITO_REDIRECT_URI = 'http://localhost:3001/api/auth/cognito/callback'
process.env.FRONTEND_URL = 'http://localhost:5173'

const request = require('supertest')
const jwt = require('jsonwebtoken')
const config = require('../config')
const createApp = require('../app')
const db = require('../config/db')
const cognitoAuth = require('../services/cognitoAuth')
const { createOAuthState } = require('../controllers/cognitoAuth')

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  jest.clearAllMocks()
  cognitoAuth.isConfigured.mockReturnValue(true)
  await db('join_requests').del().catch(() => {})
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

describe('GET /api/auth/cognito/status', () => {
  test('returns enabled true when Cognito env is present', async () => {
    const res = await request(app).get('/api/auth/cognito/status')
    expect(res.status).toBe(200)
    expect(res.body.enabled).toBe(true)
  })

  test('returns enabled false when not configured', async () => {
    cognitoAuth.isConfigured.mockReturnValue(false)
    const res = await request(app).get('/api/auth/cognito/status')
    expect(res.status).toBe(200)
    expect(res.body.enabled).toBe(false)
  })
})

describe('GET /api/auth/cognito/google/start', () => {
  test('returns authorize URL for JSON clients', async () => {
    const res = await request(app)
      .get('/api/auth/cognito/google/start')
      .set('Accept', 'application/json')

    expect(res.status).toBe(200)
    expect(res.body.authorize_url).toContain(
      'https://questly-test.auth.eu-central-1.amazoncognito.com/oauth2/authorize',
    )
    expect(res.body.authorize_url).toContain('identity_provider=Google')
    expect(res.body.authorize_url).toContain('client_id=test-cognito-client-id')
    expect(res.body.state).toBeTruthy()

    const payload = jwt.verify(res.body.state, config.jwt.secret)
    expect(payload.purpose).toBe('cognito-google')
  })

  test('redirects browsers to Cognito Hosted UI', async () => {
    const res = await request(app)
      .get('/api/auth/cognito/google/start')
      .set('Accept', 'text/html')

    expect(res.status).toBe(302)
    expect(res.headers.location).toContain(
      'https://questly-test.auth.eu-central-1.amazoncognito.com/oauth2/authorize',
    )
    expect(res.headers.location).toContain('identity_provider=Google')
  })
})

describe('GET /api/auth/cognito/callback', () => {
  test('creates a new Google-only user and redirects with Questly JWT', async () => {
    const state = createOAuthState()
    cognitoAuth.exchangeCodeForTokens.mockResolvedValue({ id_token: 'fake-id-token' })
    cognitoAuth.verifyIdToken.mockResolvedValue({
      sub: 'cognito-sub-new-1',
      email: 'google.new@example.com',
      email_verified: true,
      name: 'Google New',
    })

    const res = await request(app)
      .get('/api/auth/cognito/callback')
      .query({ code: 'auth-code', state })

    expect(res.status).toBe(302)
    const location = new URL(res.headers.location)
    expect(location.origin + location.pathname).toBe('http://localhost:5173/auth/cognito/callback')
    expect(location.searchParams.get('token')).toBeTruthy()

    const row = await db('users').where({ email: 'google.new@example.com' }).first()
    expect(row).toBeTruthy()
    expect(row.cognito_sub).toBe('cognito-sub-new-1')
    expect(row.password_hash).toBeNull()
    expect(row.role).toBe('developer')
    expect(row.username).toBe('Google New')
  })

  test('links Google to an existing email account', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'existing@example.com',
        username: 'existing',
        password: 'password123',
        role: 'developer',
      })

    const state = createOAuthState()
    cognitoAuth.exchangeCodeForTokens.mockResolvedValue({ id_token: 'fake-id-token' })
    cognitoAuth.verifyIdToken.mockResolvedValue({
      sub: 'cognito-sub-link-1',
      email: 'existing@example.com',
      email_verified: true,
      name: 'Existing User',
    })

    const res = await request(app)
      .get('/api/auth/cognito/callback')
      .query({ code: 'auth-code', state })

    expect(res.status).toBe(302)
    expect(res.headers.location).toContain('token=')

    const row = await db('users').where({ email: 'existing@example.com' }).first()
    expect(row.cognito_sub).toBe('cognito-sub-link-1')
    expect(row.password_hash).toBeTruthy()
  })

  test('rejects unverified email for non-Google tokens', async () => {
    const state = createOAuthState()
    cognitoAuth.exchangeCodeForTokens.mockResolvedValue({ id_token: 'fake-id-token' })
    cognitoAuth.verifyIdToken.mockResolvedValue({
      sub: 'cognito-sub-unverified',
      email: 'unverified@example.com',
      email_verified: false,
      name: 'Nope',
    })

    const res = await request(app)
      .get('/api/auth/cognito/callback')
      .query({ code: 'auth-code', state })

    expect(res.status).toBe(302)
    expect(res.headers.location).toContain('cognito=error')
    expect(res.headers.location).toContain('reason=email_unverified')

    const count = await db('users').where({ email: 'unverified@example.com' }).count({ c: '*' }).first()
    expect(Number(count.c)).toBe(0)
  })

  test('accepts Google-federated email when Cognito omits email_verified', async () => {
    const state = createOAuthState()
    cognitoAuth.exchangeCodeForTokens.mockResolvedValue({ id_token: 'fake-id-token' })
    cognitoAuth.verifyIdToken.mockResolvedValue({
      sub: 'cognito-sub-google-verified',
      email: 'jordanstu21@gmail.com',
      email_verified: false,
      name: 'Jordan',
      identities: JSON.stringify([
        { userId: 'google-sub', providerName: 'Google', providerType: 'Google' },
      ]),
    })

    const res = await request(app)
      .get('/api/auth/cognito/callback')
      .query({ code: 'auth-code', state })

    expect(res.status).toBe(302)
    expect(res.headers.location).toContain('token=')

    const row = await db('users').where({ email: 'jordanstu21@gmail.com' }).first()
    expect(row).toBeTruthy()
    expect(row.cognito_sub).toBe('cognito-sub-google-verified')
  })

  test('rejects invalid state', async () => {
    const res = await request(app)
      .get('/api/auth/cognito/callback')
      .query({ code: 'auth-code', state: 'not-a-jwt' })

    expect(res.status).toBe(302)
    expect(res.headers.location).toContain('reason=invalid_state')
  })
})

describe('POST /api/auth/login — Google-only user', () => {
  test('returns 401 when password_hash is null', async () => {
    await db('users').insert({
      email: 'google.only@example.com',
      username: 'googleonly',
      password_hash: null,
      role: 'developer',
      cognito_sub: 'cognito-sub-google-only',
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'google.only@example.com', password: 'anything' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })
})

describe('cognitoAuth.buildAuthorizeUrl', () => {
  test('builds Hosted UI URL with Google IdP', () => {
    const url = cognitoAuth.buildAuthorizeUrl({ state: 'abc' })
    expect(url).toContain('identity_provider=Google')
    expect(url).toContain('response_type=code')
    expect(url).toContain('scope=openid+email+profile')
    expect(url).toContain('state=abc')
    expect(url).toContain(
      encodeURIComponent('http://localhost:3001/api/auth/cognito/callback'),
    )
  })
})
