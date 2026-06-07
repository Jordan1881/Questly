// Force test DB settings — repo/org secrets (e.g. Railway DATABASE_URL) must not
// leak into Jest or knex will connect as the wrong user.
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret'
process.env.DB_HOST = process.env.DB_HOST || 'localhost'
process.env.DB_PORT = process.env.DB_PORT || '5432'
process.env.DB_USER = process.env.DB_USER || 'postgres'
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres'
process.env.DB_NAME = process.env.DB_NAME || 'questly_dev'
process.env.DB_TEST_NAME = process.env.DB_TEST_NAME || 'questly_test'
delete process.env.DATABASE_URL

// Cloud/repo Jira secrets must not hit the real Atlassian API during Jest.
delete process.env.JIRA_DIFFICULTY_FIELD_ID
delete process.env.JIRA_STORY_POINTS_FIELD_ID
process.env.JIRA_SITE_URL = 'https://test.atlassian.net'
process.env.JIRA_PROJECT_KEY = 'QUEST'
process.env.JIRA_ADMIN_EMAIL = 'admin@test.com'
process.env.JIRA_ADMIN_API_TOKEN = 'test-token'

// Block real outbound HTTP in tests; allow local Postgres/API only.
const nock = require('nock')
if (!nock.isActive()) {
  nock.activate()
}
nock.disableNetConnect()
nock.enableNetConnect(/^(127\.0\.0\.1|localhost)(:\d+)?$/)
