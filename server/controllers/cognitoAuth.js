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

async function callback(req, res) {
  try {
    const { code, state, error: oauthError, error_description: errorDescription } = req.query

    if (oauthError) {
      return redirectToFrontend(res, {
        cognito: 'error',
        reason: oauthError,
        detail: errorDescription || undefined,
      })
    }

    if (!cognitoAuth.isConfigured()) {
      return redirectToFrontend(res, { cognito: 'error', reason: 'not_configured' })
    }

    try {
      if (!state) throw new Error('Missing OAuth state')
      verifyOAuthState(state)
    } catch {
      return redirectToFrontend(res, { cognito: 'error', reason: 'invalid_state' })
    }

    if (!code) {
      return redirectToFrontend(res, { cognito: 'error', reason: 'missing_code' })
    }

    let tokens
    try {
      tokens = await cognitoAuth.exchangeCodeForTokens(code)
    } catch {
      return redirectToFrontend(res, { cognito: 'error', reason: 'exchange_failed' })
    }

    if (!tokens?.id_token) {
      return redirectToFrontend(res, { cognito: 'error', reason: 'missing_id_token' })
    }

    let claims
    try {
      claims = await cognitoAuth.verifyIdToken(tokens.id_token)
    } catch {
      return redirectToFrontend(res, { cognito: 'error', reason: 'invalid_id_token' })
    }

    const sub = claims.sub
    const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : ''
    const name = claims.name || claims['cognito:username']

    if (!sub || !email) {
      return redirectToFrontend(res, { cognito: 'error', reason: 'missing_claims' })
    }

    if (!cognitoAuth.isEmailVerified(claims.email_verified)) {
      return redirectToFrontend(res, { cognito: 'error', reason: 'email_unverified' })
    }

    let row = await UserModel.findByCognitoSub(sub)

    if (!row) {
      const byEmail = await UserModel.findByEmail(email)
      if (byEmail) {
        row = await UserModel.linkCognitoSub(byEmail.id, sub)
      } else {
        const username = await ensureUniqueUsername(usernameFromClaims({ email, name }))
        await UserModel.create({
          email,
          username,
          password_hash: null,
          role: 'developer',
          cognito_sub: sub,
        })
        row = await UserModel.findByCognitoSub(sub)
      }
    }

    if (!row) {
      return redirectToFrontend(res, { cognito: 'error', reason: 'user_upsert_failed' })
    }

    const token = signToken(row)
    const payload = { user: buildSessionUser(row), token }

    if (isMultiWorkspaceEnabled()) {
      await attachMultiWorkspaceSession(payload, row)
    }

    return redirectToFrontend(res, { token })
  } catch {
    return redirectToFrontend(res, { cognito: 'error', reason: 'unexpected' })
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
