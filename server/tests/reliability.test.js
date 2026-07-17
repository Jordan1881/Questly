// Reliability / "breaking" tests: probe idempotency and behavior under load.
// These force single-workspace (legacy) progress so balances live on `users`,
// matching the CI configuration where MULTI_WORKSPACE is unset.
process.env.MULTI_WORKSPACE = 'false'

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

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  process.env.MULTI_WORKSPACE = 'false'
  cleanNock()
  setupJiraEnv()
  jest.clearAllMocks()
  await db('xp_transactions').del()
  await db('task_assignments').del()
  await db('tasks').del()
  await db('purchases').del()
  await db('reward_coupons').del()
  await db('rewards').del()
  await db('join_requests').del()
  await db('sprints').del()
  await db('workspace_memberships').del()
  await db('users').del()
  await db('workspaces').del()
})

afterEach(() => {
  cleanNock()
})

afterAll(async () => {
  await db.destroy()
})

async function registerAndLogin(role, suffix) {
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

async function createWorkspace(adminToken, name) {
  const res = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name })
  return res.body.workspace
}

async function seedAssignedTask(workspaceId, userId, { xpReward = 40, suffix = '0' } = {}) {
  const [task] = await db('tasks')
    .insert({
      workspace_id: workspaceId,
      jira_issue_id: `rel-task-${suffix}`,
      jira_issue_key: `REL-${suffix}`,
      title: `Reliability task ${suffix}`,
      difficulty: 'medium',
      xp_reward: xpReward,
      status: 'to_do',
    })
    .returning('*')
  await db('task_assignments').insert({ task_id: task.id, user_id: userId })
  return task
}

async function countPositiveCompletionTx(userId, taskId) {
  const [{ c }] = await db('xp_transactions')
    .where({ user_id: userId, task_id: taskId, reason: 'task_completed' })
    .where('amount', '>', 0)
    .count('* as c')
  return Number(c)
}

describe('completion idempotency (double-submit protection)', () => {
  test('sequential duplicate completion is rejected and awards XP once', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'idemseq')
    const workspace = await createWorkspace(adminToken, 'Idem WS Seq')

    const dev = await registerAndLogin('developer', 'idemseq')
    await db('users').where({ id: dev.user.id }).update({ workspace_id: workspace.id })
    const task = await seedAssignedTask(workspace.id, dev.user.id, { xpReward: 40, suffix: 'seq' })

    const first = await request(app)
      .patch(`/api/tasks/${task.id}/completion`)
      .set('Authorization', `Bearer ${dev.token}`)
      .send({ completed: true })
    const second = await request(app)
      .patch(`/api/tasks/${task.id}/completion`)
      .set('Authorization', `Bearer ${dev.token}`)
      .send({ completed: true })

    expect(first.status).toBe(200)
    expect(second.status).toBe(409)

    expect(await countPositiveCompletionTx(dev.user.id, task.id)).toBe(1)
    const user = await db('users').where({ id: dev.user.id }).first()
    expect(user.lifetime_xp).toBe(40)
    expect(user.coin_balance).toBe(4)
  })

  test('10 parallel completions of the same task award XP exactly once', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'idempar')
    const workspace = await createWorkspace(adminToken, 'Idem WS Par')

    const dev = await registerAndLogin('developer', 'idempar')
    await db('users').where({ id: dev.user.id }).update({ workspace_id: workspace.id })
    const task = await seedAssignedTask(workspace.id, dev.user.id, { xpReward: 70, suffix: 'par' })

    const attempts = 10
    const results = await Promise.all(
      Array.from({ length: attempts }, () =>
        request(app)
          .patch(`/api/tasks/${task.id}/completion`)
          .set('Authorization', `Bearer ${dev.token}`)
          .send({ completed: true }),
      ),
    )

    const ok = results.filter((r) => r.status === 200)
    const conflict = results.filter((r) => r.status === 409)

    // Exactly one request should win the completion; the rest must be rejected.
    expect(ok).toHaveLength(1)
    expect(conflict).toHaveLength(attempts - 1)

    // XP/coins must be granted exactly once regardless of the race.
    expect(await countPositiveCompletionTx(dev.user.id, task.id)).toBe(1)
    const user = await db('users').where({ id: dev.user.id }).first()
    expect(user.lifetime_xp).toBe(70)
    expect(user.coin_balance).toBe(7)
  }, 30000)
})

describe('sync while developers complete tasks (no corruption, no deadlock)', () => {
  test('admin sync runs concurrently with completions without dropping or double-counting XP', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'syncload')
    const workspace = await createWorkspace(adminToken, 'Sync Load WS')

    const devCount = 6
    const devs = []
    const tasks = []
    for (let i = 0; i < devCount; i += 1) {
      const dev = await registerAndLogin('developer', `syncload${i}`)
      await db('users').where({ id: dev.user.id }).update({ workspace_id: workspace.id })
      devs.push(dev)
      tasks.push(await seedAssignedTask(workspace.id, dev.user.id, { xpReward: 40, suffix: `load${i}` }))
    }

    // Mocked Jira returns the same issues (unassigned) so the sync upserts them
    // and never prunes the tasks currently being completed.
    const issues = tasks.map((task, i) => ({
      jiraIssueId: `rel-task-load${i}`,
      jiraIssueKey: `REL-load${i}`,
      title: `Reliability task load${i}`,
      description: null,
      difficulty: 'medium',
      storyPoints: 3,
      xpReward: 40,
      dueDate: null,
      highPriority: false,
      status: 'to_do',
      assigneeAccountId: null,
    }))
    jiraClient.fetchProjectIssues.mockResolvedValue(issues)
    mockFullJiraSync()

    const syncPromise = request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const completionPromises = devs.map((dev, i) =>
      request(app)
        .patch(`/api/tasks/${tasks[i].id}/completion`)
        .set('Authorization', `Bearer ${dev.token}`)
        .send({ completed: true }),
    )

    const [syncRes, ...completions] = await Promise.all([syncPromise, ...completionPromises])

    expect(syncRes.status).toBe(200)
    expect(syncRes.body.synced).toBe(devCount)

    completions.forEach((res) => expect(res.status).toBe(200))

    // Each developer earned XP exactly once for their own task.
    for (let i = 0; i < devCount; i += 1) {
      expect(await countPositiveCompletionTx(devs[i].user.id, tasks[i].id)).toBe(1)
      const user = await db('users').where({ id: devs[i].user.id }).first()
      expect(user.lifetime_xp).toBe(40)
    }

    // Tasks survived the concurrent sync (none pruned) and remain completable.
    const remaining = await db('tasks').where({ workspace_id: workspace.id })
    expect(remaining).toHaveLength(devCount)
  }, 30000)
})
