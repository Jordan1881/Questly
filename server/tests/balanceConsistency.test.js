// Regression tests for XP/coin "dual-write drift": under MULTI_WORKSPACE the
// authoritative balances live in workspace_memberships, and every read path must
// reflect them (not the legacy users-table columns).
process.env.MULTI_WORKSPACE = 'true'

require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const { cleanupCoreTables } = require('./helpers/cleanup')

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  process.env.MULTI_WORKSPACE = 'true'
  await cleanupCoreTables(db)
})

afterEach(() => {
  process.env.MULTI_WORKSPACE = 'true'
})

afterAll(async () => {
  delete process.env.MULTI_WORKSPACE
  await db.destroy()
})

async function register(email, username) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, username, password: 'password123' })
  expect(res.status).toBe(201)
  return res.body
}

async function setupDeveloperInWorkspace() {
  const owner = await register('bc-owner@test.com', 'bcowner')
  const ws = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ name: 'Balance HQ' })
  expect(ws.status).toBe(201)

  const developer = await register('bc-dev@test.com', 'bcdev')
  await request(app)
    .post(`/api/workspaces/${ws.body.workspace.id}/join-requests`)
    .set('Authorization', `Bearer ${developer.token}`)
    .send({})
  const pending = await db('join_requests').where({ user_id: developer.user.id }).first()
  await request(app)
    .patch(`/api/workspaces/${ws.body.workspace.id}/join-requests/${pending.id}`)
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ status: 'approved' })

  return { owner, developer, workspaceId: ws.body.workspace.id }
}

async function seedAssignedTask(workspaceId, userId, { xpReward = 40, suffix = '0' } = {}) {
  const [task] = await db('tasks')
    .insert({
      workspace_id: workspaceId,
      jira_issue_id: `bc-task-${suffix}`,
      jira_issue_key: `BC-${suffix}`,
      title: `Balance task ${suffix}`,
      difficulty: 'medium',
      xp_reward: xpReward,
      status: 'to_do',
    })
    .returning('*')
  await db('task_assignments').insert({ task_id: task.id, user_id: userId })
  return task
}

describe('profile balance consistency under MULTI_WORKSPACE', () => {
  test('GET /api/users/me returns membership balances, not stale users-table balances', async () => {
    const { developer, workspaceId } = await setupDeveloperInWorkspace()

    // Force drift: membership (authoritative) has real balances, users row is stale.
    await db('workspace_memberships')
      .where({ user_id: developer.user.id, workspace_id: workspaceId })
      .update({ current_sprint_xp: 110, lifetime_xp: 110, coin_balance: 6 })
    await db('users')
      .where({ id: developer.user.id })
      .update({ current_sprint_xp: 0, lifetime_xp: 0, coin_balance: 0 })

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${developer.token}`)

    expect(res.status).toBe(200)
    expect(res.body.profile.lifetimeXp).toBe(110)
    expect(res.body.profile.currentSprintXp).toBe(110)
    expect(res.body.profile.coinBalance).toBe(6)
  })

  test('membership balance and profile reconcile with the XP ledger after completion', async () => {
    const { developer, workspaceId } = await setupDeveloperInWorkspace()
    const task = await seedAssignedTask(workspaceId, developer.user.id, {
      xpReward: 40,
      suffix: 'recon',
    })

    const completion = await request(app)
      .patch(`/api/tasks/${task.id}/completion`)
      .set('Authorization', `Bearer ${developer.token}`)
      .set('X-Workspace-Id', workspaceId)
      .send({ completed: true })
    expect(completion.status).toBe(200)

    // Ledger sum of positive task_completed transactions.
    const [{ sum }] = await db('xp_transactions')
      .where({ user_id: developer.user.id, reason: 'task_completed' })
      .where('amount', '>', 0)
      .sum('amount as sum')
    const ledgerXp = Number(sum)

    const membership = await db('workspace_memberships')
      .where({ user_id: developer.user.id, workspace_id: workspaceId })
      .first()

    expect(membership.lifetime_xp).toBe(40)
    expect(membership.lifetime_xp).toBe(ledgerXp)
    expect(membership.coin_balance).toBe(4)

    const me = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${developer.token}`)
    expect(me.status).toBe(200)
    expect(me.body.profile.lifetimeXp).toBe(membership.lifetime_xp)
    expect(me.body.profile.coinBalance).toBe(membership.coin_balance)
  })
})
