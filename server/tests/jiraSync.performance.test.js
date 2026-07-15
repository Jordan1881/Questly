require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const jiraClient = require('../services/jiraClient')
const { mockFullJiraSync, setupJiraEnv, cleanNock } = require('./helpers/jiraNock')

jest.mock('../services/jiraClient', () => ({
  ...jest.requireActual('../services/jiraClient'),
  fetchProjectIssues: jest.fn(),
}))

const app = createApp()

function buildBulkIssues(count = 110) {
  return Array.from({ length: count }, (_, i) => ({
    jiraIssueId: String(30000 + i),
    jiraIssueKey: `PERF-${i}`,
    title: `Perf task ${i}`,
    description: null,
    difficulty: 'medium',
    storyPoints: 3,
    xpReward: 40,
    dueDate: null,
    highPriority: false,
    status: 'to_do',
    assigneeAccountId: i % 11 === 0 ? 'dev-jira-id' : null,
  }))
}

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(() => {
  cleanNock()
  setupJiraEnv()
  jest.clearAllMocks()
})

afterEach(() => {
  cleanNock()
})

beforeEach(async () => {
  await db('xp_transactions').del()
  await db('task_assignments').del()
  await db('tasks').del()
  await db('purchases').del()
  await db('reward_coupons').del()
  await db('rewards').del()
  await db('join_requests').del()
  await db('sprints').del()
  await db('users').del()
  await db('workspaces').del()
})

afterAll(async () => {
  await db.destroy()
})

async function registerAdmin() {
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'perf@test.com', username: 'perfadmin', password: 'password123', role: 'admin' })
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'perf@test.com', password: 'password123' })
  return login.body.token
}

describe('Jira sync performance', () => {
  // Soft wall-clock budget for CI runners (noisy); keeps a ceiling without 3s flakes.
  const SYNC_BUDGET_MS = 5000

  test('sync of 110 issues completes within budget', async () => {
    const adminToken = await registerAdmin()
    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Perf WS' })
    const workspace = workspaceRes.body.workspace

    const developers = []
    for (let i = 0; i < 10; i += 1) {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: `perfdev${i}@test.com`,
          username: `perfdev${i}`,
          password: 'password123',
          role: 'developer',
        })
      const dev = await db('users').where({ email: `perfdev${i}@test.com` }).first()
      await db('users')
        .where({ id: dev.id })
        .update({ workspace_id: workspace.id, jira_account_id: 'dev-jira-id' })
      developers.push(dev)
    }

    const issues = buildBulkIssues(110)
    jiraClient.fetchProjectIssues.mockResolvedValue(issues)
    mockFullJiraSync()

    const start = Date.now()
    const res = await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    const elapsed = Date.now() - start

    expect(res.status).toBe(200)
    expect(res.body.synced).toBe(110)
    expect(elapsed).toBeLessThan(SYNC_BUDGET_MS)

    const taskCount = await db('tasks').where({ workspace_id: workspace.id }).count('* as c')
    expect(Number(taskCount[0].c)).toBe(110)
  }, 15000)
})
