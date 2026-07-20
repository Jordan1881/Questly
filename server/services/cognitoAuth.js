const https = require('https')
const { URL } = require('url')
const { CognitoJwtVerifier } = require('aws-jwt-verify')
const config = require('../config')

let idTokenVerifier = null

/** Live env + config defaults so tests can set COGNITO_* after module load. */
function getCognitoSettings() {
  const domainRaw = process.env.COGNITO_DOMAIN || config.cognito.domain
  const domain = domainRaw
    ? String(domainRaw).replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null

  return {
    region: process.env.COGNITO_REGION || config.cognito.region,
    userPoolId: process.env.COGNITO_USER_POOL_ID || config.cognito.userPoolId,
    clientId: process.env.COGNITO_CLIENT_ID || config.cognito.clientId,
    clientSecret: process.env.COGNITO_CLIENT_SECRET || config.cognito.clientSecret,
    domain,
    redirectUri: process.env.COGNITO_REDIRECT_URI || config.cognito.redirectUri,
  }
}

function isConfigured() {
  const { region, userPoolId, clientId, clientSecret, domain, redirectUri } = getCognitoSettings()
  return Boolean(region && userPoolId && clientId && clientSecret && domain && redirectUri)
}

function getIdTokenVerifier() {
  const { userPoolId, clientId } = getCognitoSettings()
  if (!isConfigured()) {
    throw new Error('Cognito is not configured')
  }
  if (
    !idTokenVerifier ||
    idTokenVerifier._userPoolId !== userPoolId ||
    idTokenVerifier._clientId !== clientId
  ) {
    idTokenVerifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId,
    })
    idTokenVerifier._userPoolId = userPoolId
    idTokenVerifier._clientId = clientId
  }
  return idTokenVerifier
}

/** Reset cached verifier (tests). */
function resetVerifierForTests() {
  idTokenVerifier = null
}

function httpFormPost(targetUrl, formBody, headers = {}) {
  const url = new URL(targetUrl)
  const payload = typeof formBody === 'string' ? formBody : new URLSearchParams(formBody).toString()
  const reqHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(payload),
    ...headers,
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: reqHeaders,
      },
      (res) => {
        let text = ''
        res.on('data', (chunk) => {
          text += chunk
        })
        res.on('end', () => {
          let parsed
          try {
            parsed = text ? JSON.parse(text) : null
          } catch {
            parsed = text
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            const message =
              (typeof parsed === 'object' &&
                (parsed.error_description || parsed.error || parsed.message)) ||
              `Cognito token request failed with HTTP ${res.statusCode}`
            const err = new Error(message)
            err.status = res.statusCode
            err.body = parsed
            reject(err)
            return
          }

          resolve(parsed)
        })
      },
    )

    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

function buildAuthorizeUrl({ state, identityProvider = 'Google' } = {}) {
  if (!isConfigured()) {
    throw new Error('Cognito is not configured')
  }

  const { clientId, domain, redirectUri } = getCognitoSettings()
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: redirectUri,
    state,
    identity_provider: identityProvider,
  })

  return `https://${domain}/oauth2/authorize?${params.toString()}`
}

async function exchangeCodeForTokens(code) {
  if (!isConfigured()) {
    throw new Error('Cognito is not configured')
  }

  const { clientId, clientSecret, domain, redirectUri } = getCognitoSettings()
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  return httpFormPost(
    `https://${domain}/oauth2/token`,
    {
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
    },
    { Authorization: `Basic ${basic}` },
  )
}

async function verifyIdToken(idToken) {
  const payload = await getIdTokenVerifier().verify(idToken)
  return payload
}

function isEmailVerified(claim) {
  return claim === true || claim === 'true'
}

module.exports = {
  isConfigured,
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  verifyIdToken,
  isEmailVerified,
  resetVerifierForTests,
  getCognitoSettings,
}
