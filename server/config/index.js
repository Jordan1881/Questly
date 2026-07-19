// Reads and validates environment variables. Does NOT call dotenv.config() — that's done in index.js.
// Feature flags: read via lib/featureFlags at call time (e.g. isMultiWorkspaceEnabled).

const required = ['JWT_SECRET']

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3001,
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
  apiPublicUrl:
    process.env.API_PUBLIC_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : null),
  atlassian: {
    clientId: process.env.ATLASSIAN_CLIENT_ID || null,
    clientSecret: process.env.ATLASSIAN_CLIENT_SECRET || null,
    callbackUrl:
      process.env.ATLASSIAN_OAUTH_CALLBACK_URL ||
      (process.env.API_PUBLIC_URL
        ? `${process.env.API_PUBLIC_URL.replace(/\/$/, '')}/api/auth/jira/oauth/callback`
        : process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api/auth/jira/oauth/callback`
          : `http://localhost:${Number(process.env.PORT) || 3001}/api/auth/jira/oauth/callback`),
    workspaceCallbackUrl:
      process.env.ATLASSIAN_WORKSPACE_OAUTH_CALLBACK_URL ||
      (process.env.API_PUBLIC_URL
        ? `${process.env.API_PUBLIC_URL.replace(/\/$/, '')}/api/workspaces/jira/oauth/callback`
        : process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api/workspaces/jira/oauth/callback`
          : `http://localhost:${Number(process.env.PORT) || 3001}/api/workspaces/jira/oauth/callback`),
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
}
