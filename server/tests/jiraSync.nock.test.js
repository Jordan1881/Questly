const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const {
  mockFullJiraSync,
  setupJiraEnv,
  cleanNock,
  assertNoPendingNock,
  DEFAULT_SITE,
} = require('./helpers/jiraNock')

const JIRA_CREDENTIALS = {
  siteUrl: DEFAULT_SITE,
  projectKey: 'QUEST',
  email: 'admin@test.com',
  apiToken: 'test-token',
}

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  cleanNock()
  setupJiraEnv(JIRA_CREDENTIALS)
  mockFullJiraSync(JIRA_CREDENTIALS)
  await db('xp_transactions').del()
  await db('task_assignments').del()
  await db('tasks').del()
  await db('join_requests').del()
  await db('users').del()
  await db('workspaces').del()
})

afterAll(async () => {
  await db.destroy()
})

afterEach(() => {
  cleanNock()
})

async function registerAndLogin(role = 'admin', suffix = '') {
  const email = role === 'admin' ? `admin${suffix}@test.com` : `dev${suffix}@test.com`
  const username = role === 'admin' ? `admin${suffix}` : `dev${suffix}`
  await request(app)
    .post('/api/auth/register')
    .send({ email, username, password: 'password123', role })
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' })
  return { token: res.body.token, user: res.body.user }
}

async function createWorkspaceWithDeveloper(suffix = '') {
  const { token: adminToken } = await registerAndLogin('admin', suffix)
  const workspaceRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Workspace ${suffix}` })

  const { token: devToken, user: devUser } = await registerAndLogin('developer', `${suffix}dev`)
  await db('users')
    .where({ id: devUser.id })
    .update({ workspace_id: workspaceRes.body.workspace.id, jira_account_id: 'dev-jira-id' })

  return {
    adminToken,
    devToken,
    workspace: workspaceRes.body.workspace,
    devUserId: devUser.id,
  }
}

describe('POST /api/tasks/sync with nock', () => {
  test('syncs tasks from nock-intercepted Jira HTTP without jest mocks', async () => {
    const { adminToken, workspace, devUserId } = await createWorkspaceWithDeveloper('nock')

    await db('workspaces').where({ id: workspace.id }).update({
      jira_site_url: JIRA_CREDENTIALS.siteUrl,
      jira_project_key: JIRA_CREDENTIALS.projectKey,
      jira_access_token: JIRA_CREDENTIALS.apiToken,
    })

    const res = await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ synced: 2, created: 2 })

    const tasks = await db('tasks').where({ workspace_id: workspace.id })
    expect(tasks.map((t) => t.jira_issue_key).sort()).toEqual(['SCRUM-1', 'SCRUM-2'])

    const assignments = await db('task_assignments').where({ user_id: devUserId })
    expect(assignments.length).toBeGreaterThanOrEqual(2)

    assertNoPendingNock()
  })
})
