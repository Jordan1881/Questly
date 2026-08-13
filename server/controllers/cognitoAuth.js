const jwt = require('jsonwebtoken')
const config = require('../config')
const UserModel = require('../models/user')
const cognitoAuth = require('../services/cognitoAuth')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')
const {
  signToken,
  buildSessionUser,
  attachMultiWorkspaceSession,
} = require('./auth')

const STATE_PURPOSE = 'cognito-google'

function createOAuthState() {
  return jwt.sign({ purpose: STATE_PURPOSE }, config.jwt.secret, { expiresIn: '15m' })
}

function verifyOAuthState(state) {
  const payload = jwt.verify(state, config.jwt.secret)
  if (payload.purpose !== STATE_PURPOSE) {
    throw new Error('Invalid OAuth state')
  }
  return payload
}

function redirectToFrontend(res, params = {}) {
  const url = new URL('/auth/cognito/callback', config.frontendUrl)
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) url.searchParams.set(key, value)
  })
  res.redirect(url.toString())
}

function usernameFromClaims({ email, name }) {
  const fromName = typeof name === 'string' ? name.trim() : ''
  if (fromName.length >= 2) return fromName.slice(0, 80)

  const local = String(email || '')
    .split('@')[0]
    .replace(/[^a-zA-Z0-9._-]/g, '')
  return (local || 'user').slice(0, 80)
}

async function ensureUniqueUsername(base) {
  let candidate = base
  let n = 0
  while (await UserModel.findByUsername(candidate)) {
    n += 1
    candidate = `${base.slice(0, 70)}${n}`
  }
  return candidate
}

async function status(_req, res) {
  res.json({ enabled: cognitoAuth.isConfigured() })
}

async function startGoogle(req, res, next) {
  try {
    if (!cognitoAuth.isConfigured()) {
      return res.status(503).json({ error: 'Google sign-in is not configured on this server' })
    }

    const state = createOAuthState()
    const authorizeUrl = cognitoAuth.buildAuthorizeUrl({ state })

    // Browser navigations prefer a redirect; API clients can still follow Location.
    if (req.accepts(['html', 'json']) === 'json' && !req.query.redirect) {
      return res.json({ authorize_url: authorizeUrl, state })
    }

    res.redirect(authorizeUrl)
  } catch (err) {
    next(err)
  }
}

function redirectCognitoError(res, reason, detail) {
  return redirectToFrontend(res, {
    cognito: 'error',
    reason,
    detail: detail || undefined,
  })
}

async function exchangeAndVerifyIdToken(code) {
  let tokens
  try {
    tokens = await cognitoAuth.exchangeCodeForTokens(code)
  } catch {
    return { error: 'exchange_failed' }
  }

  if (!tokens?.id_token) {
    return { error: 'missing_id_token' }
  }

  try {
    const claims = await cognitoAuth.verifyIdToken(tokens.id_token)
    return { claims }
  } catch {
    return { error: 'invalid_id_token' }
  }
}

async function findOrProvisionCognitoUser({ sub, email, name }) {
  let row = await UserModel.findByCognitoSub(sub)
  if (row) return row

  const byEmail = await UserModel.findByEmail(email)
  if (byEmail) {
    return UserModel.linkCognitoSub(byEmail.id, sub)
  }

  const username = await ensureUniqueUsername(usernameFromClaims({ email, name }))
  await UserModel.create({
    email,
    username,
    password_hash: null,
    role: 'developer',
    cognito_sub: sub,
  })
  return UserModel.findByCognitoSub(sub)
}

async function callback(req, res) {
  try {
    const { code, state, error: oauthError, error_description: errorDescription } = req.query

    if (oauthError) {
      return redirectCognitoError(res, oauthError, errorDescription || undefined)
    }

    if (!cognitoAuth.isConfigured()) {
      return redirectCognitoError(res, 'not_configured')
    }

    try {
      if (!state) throw new Error('Missing OAuth state')
      verifyOAuthState(state)
    } catch {
      return redirectCognitoError(res, 'invalid_state')
    }

    if (!code) {
      return redirectCognitoError(res, 'missing_code')
    }

    const tokenResult = await exchangeAndVerifyIdToken(code)
    if (tokenResult.error) {
      return redirectCognitoError(res, tokenResult.error)
    }

    const claims = tokenResult.claims
    const sub = claims.sub
    const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : ''
    const name = claims.name || claims['cognito:username']

    if (!sub || !email) {
      return redirectCognitoError(res, 'missing_claims')
    }

    // Do not require claims.email_verified: Cognito Google IdP often omits it or
    // sets false unless Google's attribute is mapped. This callback only runs after
    // a verified cognito-google OAuth state from /cognito/google/start.

    const row = await findOrProvisionCognitoUser({ sub, email, name })
    if (!row) {
      return redirectCognitoError(res, 'user_upsert_failed')
    }

    const token = signToken(row)
    const payload = { user: buildSessionUser(row), token }

    if (isMultiWorkspaceEnabled()) {
      await attachMultiWorkspaceSession(payload, row)
    }

    return redirectToFrontend(res, { token })
  } catch {
    return redirectCognitoError(res, 'unexpected')
  }
}

module.exports = {
  status,
  startGoogle,
  callback,
  createOAuthState,
  verifyOAuthState,
  usernameFromClaims,
}
