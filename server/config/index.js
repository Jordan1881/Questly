// Reads and validates environment variables. Does NOT call dotenv.config() — that's done in index.js.
// Feature flags: read via lib/featureFlags at call time (e.g. isMultiWorkspaceEnabled).

const required = ['JWT_SECRET']

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})

function defaultLocalPort() {
  return Number(process.env.PORT) || 3001
}

function stripTrailingSlash(url) {
  return url.replace(/\/$/, '')
}

/** Prefer API_PUBLIC_URL, then Railway domain, else localhost. */
function resolvePublicCallback(pathSuffix) {
  if (process.env.API_PUBLIC_URL) {
    return `${stripTrailingSlash(process.env.API_PUBLIC_URL)}${pathSuffix}`
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}${pathSuffix}`
  }
  return `http://localhost:${defaultLocalPort()}${pathSuffix}`
}

function resolveApiPublicUrl() {
  if (process.env.API_PUBLIC_URL) return process.env.API_PUBLIC_URL
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  }
  return null
}

function resolveCognitoDomain() {
  if (!process.env.COGNITO_DOMAIN) return null
  return String(process.env.COGNITO_DOMAIN).replace(/^https?:\/\//, '').replace(/\/$/, '')
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: defaultLocalPort(),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'questly_dev',
    testName: process.env.DB_TEST_NAME || 'questly_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    url: process.env.DATABASE_URL || null,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  apiPublicUrl: resolveApiPublicUrl(),
  atlassian: {
    clientId: process.env.ATLASSIAN_CLIENT_ID || null,
    clientSecret: process.env.ATLASSIAN_CLIENT_SECRET || null,
    callbackUrl:
      process.env.ATLASSIAN_OAUTH_CALLBACK_URL ||
      resolvePublicCallback('/api/auth/jira/oauth/callback'),
    workspaceCallbackUrl:
      process.env.ATLASSIAN_WORKSPACE_OAUTH_CALLBACK_URL ||
      resolvePublicCallback('/api/workspaces/jira/oauth/callback'),
    reportingRefreshToken: process.env.ATLASSIAN_REPORTING_REFRESH_TOKEN || null,
  },
  jira: {
    siteUrl: process.env.JIRA_SITE_URL || null,
    projectKey: process.env.JIRA_PROJECT_KEY || null,
    adminEmail: process.env.JIRA_ADMIN_EMAIL || null,
    adminApiToken: process.env.JIRA_ADMIN_API_TOKEN || null,
    developerEmail: process.env.JIRA_DEVELOPER_EMAIL || null,
    developerApiToken: process.env.JIRA_DEVELOPER_API_TOKEN || null,
    developerAccountId:
      process.env.JIRA_DEVELOPER_ACCOUNT_ID || process.env.JIRA_ACCOUNT_ID || null,
    storyPointsFieldId: process.env.JIRA_STORY_POINTS_FIELD_ID || null,
    // Reliability knobs for outbound calls to Atlassian (external dependency).
    requestTimeoutMs: Number(process.env.JIRA_REQUEST_TIMEOUT_MS) || 10000,
    maxRetries: Number.isFinite(Number(process.env.JIRA_MAX_RETRIES))
      ? Number(process.env.JIRA_MAX_RETRIES)
      : 2,
    pageSize: Number(process.env.JIRA_PAGE_SIZE) || 100,
  },
  cognito: {
    region: process.env.COGNITO_REGION || null,
    userPoolId: process.env.COGNITO_USER_POOL_ID || null,
    clientId: process.env.COGNITO_CLIENT_ID || null,
    clientSecret: process.env.COGNITO_CLIENT_SECRET || null,
    // Host only (no scheme), e.g. questly-dev.auth.eu-central-1.amazoncognito.com
    domain: resolveCognitoDomain(),
    redirectUri:
      process.env.COGNITO_REDIRECT_URI ||
      resolvePublicCallback('/api/auth/cognito/callback'),
  },
}
