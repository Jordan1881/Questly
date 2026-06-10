require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const jiraClient = require('../services/jiraClient')

jest.mock('../services/jiraClient', () => ({
  ...jest.requireActual('../services/jiraClient'),
  fetchProjectIssues: jest.fn(),
}))

const app = createApp()

const MOCK_ISSUES = [
  {
    jiraIssueId: '10001',
    jiraIssueKey: 'SCRUM-1',
    title: 'Task 1',
    description: 'First task',
    difficulty: 'easy',
    xpReward: 20,
    dueDate: '2026-03-10',
    highPriority: false,
    status: 'to_do',
    assigneeAccountId: null,
  },
]

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  jest.clearAllMocks()
  jiraClient.fetchProjectIssues.mockResolvedValue(MOCK_ISSUES)
  await db('xp_approval_requests').del()
  await db('xp_transactions').del()
  await db('task_assignments').del()
  await db('tasks').del()
  await db('sprints').del()
  await db('join_requests').del()
  await db('purchases').del()
  await db('reward_coupons').del()
  await db('rewards').del()
  await db('users').del()
  await db('workspaces').del()
})

afterAll(async () => {
  await db.destroy()
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

async function setupWorkspaceWithApprovalEnabled(suffix = '') {
  const { token: adminToken, user: adminUser } = await registerAndLogin('admin', suffix)
  const workspaceRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Team ${suffix}` })
  const workspace = workspaceRes.body.workspace

  await request(app)
    .patch(`/api/workspaces/${workspace.id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ require_xp_approval: true })

  const { token: devToken, user: devUser } = await registerAndLogin('developer', suffix)
  await request(app)
    .post(`/api/workspaces/${workspace.id}/join-requests`)
    .set('Authorization', `Bearer ${devToken}`)
    .send({})

  const pending = await request(app)
    .get(`/api/workspaces/${workspace.id}/join-requests`)
    .set('Authorization', `Bearer ${adminToken}`)

  await request(app)
    .patch(`/api/workspaces/${workspace.id}/join-requests/${pending.body.join_requests[0].id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'approved' })

  await request(app)
    .post(`/api/tasks/sync/${workspace.id}`)
    .set('Authorization', `Bearer ${adminToken}`)

  return { adminToken, devToken, workspace, devUser, adminUser }
}

describe('XP approval flow', () => {
  test('completion with approval enabled creates pending XP instead of awarding immediately', async () => {
    const { adminToken, devToken, workspace, devUser } = await setupWorkspaceWithApprovalEnabled('pending')

    const listRes = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)
    const task = listRes.body.tasks[0]

    const res = await request(app)
      .patch(`/api/tasks/${task.id}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    expect(res.status).toBe(200)
    expect(res.body.task).toMatchObject({ done: true, xpPending: true, xpPendingAmount: 20 })
    expect(res.body.reward).toMatchObject({ xpDelta: 0, coinsDelta: 0, pending: true, pendingXp: 20 })

    const devUserRow = await db('users').where({ id: devUser.id }).first()
    expect(devUserRow.current_sprint_xp).toBe(0)
    expect(devUserRow.coin_balance).toBe(0)

    const approvals = await request(app)
      .get(`/api/workspaces/${workspace.id}/xp-approvals`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(approvals.body.xp_approval_requests).toHaveLength(1)
    expect(approvals.body.xp_approval_requests[0].xp_amount).toBe(20)
  })

  test('unchecking a pending completion cancels the approval request', async () => {
    const { devToken } = await setupWorkspaceWithApprovalEnabled('cancel')

    const listRes = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)
    const taskId = listRes.body.tasks[0].id

    await request(app)
      .patch(`/api/tasks/${taskId}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: false })

    expect(res.status).toBe(200)
    expect(res.body.task).toMatchObject({ done: false, xpPending: false })
    expect(res.body.reward).toMatchObject({ pendingCancelled: true })

    const pending = await db('xp_approval_requests').where({ status: 'pending' })
    expect(pending).toHaveLength(0)
  })

  test('admin approve awards XP and coins at XP/10', async () => {
    const { adminToken, devToken, workspace, devUser } = await setupWorkspaceWithApprovalEnabled('approve')

    const listRes = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)
    const task = listRes.body.tasks[0]

    await request(app)
      .patch(`/api/tasks/${task.id}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    const pending = await request(app)
      .get(`/api/workspaces/${workspace.id}/xp-approvals`)
      .set('Authorization', `Bearer ${adminToken}`)

    const res = await request(app)
      .patch(`/api/workspaces/${workspace.id}/xp-approvals/${pending.body.xp_approval_requests[0].id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' })

    expect(res.status).toBe(200)
    expect(res.body.reward).toMatchObject({ xpDelta: 20, coinsDelta: 2 })

    const devUserRow = await db('users').where({ id: devUser.id }).first()
    expect(devUserRow.current_sprint_xp).toBe(20)
    expect(devUserRow.coin_balance).toBe(2)
  })

  test('admin reject returns task to not done without awarding XP', async () => {
    const { adminToken, devToken, workspace } = await setupWorkspaceWithApprovalEnabled('reject')

    const listRes = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)
    const taskId = listRes.body.tasks[0].id

    await request(app)
      .patch(`/api/tasks/${taskId}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    const pending = await request(app)
      .get(`/api/workspaces/${workspace.id}/xp-approvals`)
      .set('Authorization', `Bearer ${adminToken}`)

    const res = await request(app)
      .patch(`/api/workspaces/${workspace.id}/xp-approvals/${pending.body.xp_approval_requests[0].id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' })

    expect(res.status).toBe(200)

    const assignment = await db('task_assignments').where({ task_id: taskId }).first()
    expect(assignment.completed_at).toBeNull()

    const listAfter = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)
    expect(listAfter.body.tasks[0]).toMatchObject({ done: false, xpPending: false })
  })
})
