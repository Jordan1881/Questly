const https = require('https')
const { URL } = require('url')
const config = require('../config')

const AUTH_BASE = 'https://auth.atlassian.com'
const API_BASE = 'https://api.atlassian.com'
const DEFAULT_SCOPES = 'read:jira-work read:jira-user read:me offline_access'

function isConfigured() {
  const { clientId, clientSecret, callbackUrl } = config.atlassian
  return Boolean(clientId && clientSecret && callbackUrl)
}

function httpRequest(targetUrl, { method = 'GET', headers = {}, body = null } = {}) {
  const url = new URL(targetUrl)
  const payload = body ? JSON.stringify(body) : null
  const reqHeaders = { ...headers }

  if (payload) {
    reqHeaders['Content-Type'] = 'application/json'
    reqHeaders['Content-Length'] = Buffer.byteLength(payload)
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method,
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
              `Atlassian request failed with HTTP ${res.statusCode}`
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
    if (payload) req.write(payload)
    req.end()
  })
}

function buildAuthorizeUrl({ state, scopes = DEFAULT_SCOPES }) {
  const { clientId, callbackUrl } = config.atlassian
  const params = new URLSearchParams({
    audience: 'api.atlassian.com',
    client_id: clientId,
    scope: scopes,
    redirect_uri: callbackUrl,
    state,
    response_type: 'code',
    prompt: 'consent',
  })

  return `${AUTH_BASE}/authorize?${params.toString()}`
}

async function exchangeAuthorizationCode(code) {
  const { clientId, clientSecret, callbackUrl } = config.atlassian

  return httpRequest(`${AUTH_BASE}/oauth/token`, {
    method: 'POST',
    body: {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
    },
  })
}

async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = config.atlassian

  return httpRequest(`${AUTH_BASE}/oauth/token`, {
    method: 'POST',
    body: {
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    },
  })
}

async function fetchAccessibleResources(accessToken) {
  return httpRequest(`${API_BASE}/oauth/token/accessible-resources`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
}

async function fetchAuthenticatedUser(accessToken) {
  return httpRequest(`${API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
}

function normalizeSiteUrl(siteUrl) {
  return (siteUrl || '').replace(/\/$/, '').toLowerCase()
}

function siteUrlInResources(siteUrl, resources) {
  const normalized = normalizeSiteUrl(siteUrl)
  return (resources || []).some((resource) => normalizeSiteUrl(resource.url) === normalized)
}

module.exports = {
  DEFAULT_SCOPES,
  isConfigured,
  buildAuthorizeUrl,
  exchangeAuthorizationCode,
  refreshAccessToken,
  fetchAccessibleResources,
  fetchAuthenticatedUser,
  siteUrlInResources,
  httpRequest,
}
