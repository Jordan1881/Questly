require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const { reconcileTaskAssignments } = require('../services/taskAssignmentReconcile')

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  await db('xp_transactions').del()
  await db('task_assignments').del()
  await db('tasks').del()
  await db('sprints').del()
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

async function createWorkspace(adminToken, suffix = '') {
  const res = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `WS ${suffix}` })
  return res.body.workspace
}

describe('edge cases', () => {
  test('purchase with insufficient XP returns 400', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'poor')
    const workspace = await createWorkspace(adminToken, 'poor')
    const rewardRes = await request(app)
      .post(`/api/workspaces/${workspace.id}/rewards`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Prize', description: 'x', xpCost: 100 })
    await request(app)
      .post(`/api/rewards/${rewardRes.body.reward.id}/coupons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ couponCodes: ['C1'] })

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'poordev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id, current_sprint_xp: 5 })

    const res = await request(app)
      .post(`/api/rewards/${rewardRes.body.reward.id}/purchase`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Insufficient/i)
  })

  test('purchase when all coupons expired returns 400', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'exp')
    const workspace = await createWorkspace(adminToken, 'exp')
    const rewardRes = await request(app)
      .post(`/api/workspaces/${workspace.id}/rewards`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Old', description: 'x', xpCost: 10 })
    await request(app)
      .post(`/api/rewards/${rewardRes.body.reward.id}/coupons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ couponCodes: ['OLD'], expiresAt: '2020-01-01T00:00:00.000Z' })

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'expdev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id, current_sprint_xp: 50 })

    const res = await request(app)
      .post(`/api/rewards/${rewardRes.body.reward.id}/purchase`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(400)
  })

  test('double task completion returns 409 without duplicate XP', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'dbl')
    const workspace = await createWorkspace(adminToken, 'dbl')
    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'dbldev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    const [task] = await db('tasks')
      .insert({
        workspace_id: workspace.id,
        jira_issue_id: 'edge-dbl',
        jira_issue_key: 'E-dbl',
        title: 'T',
        difficulty: 'easy',
        xp_reward: 20,
        status: 'to_do',
      })
      .returning('*')
    await db('task_assignments').insert({ task_id: task.id, user_id: devUser.id })

    await request(app)
      .patch(`/api/tasks/${task.id}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    const res = await request(app)
      .patch(`/api/tasks/${task.id}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    expect(res.status).toBe(409)
  })

  test('completion without TaskAssignment returns 403', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'noassign')
    const workspace = await createWorkspace(adminToken, 'noassign')
    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'noassigndev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    const [task] = await db('tasks')
      .insert({
        workspace_id: workspace.id,
        jira_issue_id: 'edge-na',
        jira_issue_key: 'E-na',
        title: 'Unassigned',
        difficulty: 'easy',
        xp_reward: 20,
        status: 'to_do',
      })
      .returning('*')

    const res = await request(app)
      .patch(`/api/tasks/${task.id}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    expect(res.status).toBe(403)
  })

  test('duplicate active sprint creation returns 409', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'dupsp')
    const workspace = await createWorkspace(adminToken, 'dupsp')

    await request(app)
      .post(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Sprint 1' })

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Sprint 2' })

    expect(res.status).toBe(409)
  })

  test('sync reconcile preserves completed assignment when assignee removed', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'preserve')
    const workspace = await createWorkspace(adminToken, 'preserve')
    const { user: devUser } = await registerAndLogin('developer', 'preservedev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    const [task] = await db('tasks')
      .insert({
        workspace_id: workspace.id,
        jira_issue_id: 'edge-pres',
        jira_issue_key: 'E-pres',
        title: 'Done task',
        difficulty: 'easy',
        xp_reward: 20,
        status: 'done',
      })
      .returning('*')

    await db('task_assignments').insert({
      task_id: task.id,
      user_id: devUser.id,
      completed_at: db.fn.now(),
    })

    await reconcileTaskAssignments(task.id, [])

    const row = await db('task_assignments').where({ task_id: task.id, user_id: devUser.id }).first()
    expect(row.completed_at).not.toBeNull()
  })

  test('expired coupon cannot be purchased even with sufficient XP', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'expcoup')
    const workspace = await createWorkspace(adminToken, 'expcoup')
    const rewardRes = await request(app)
      .post(`/api/workspaces/${workspace.id}/rewards`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Stale', description: 'x', xpCost: 5 })

    await db('reward_coupons').insert({
      reward_id: rewardRes.body.reward.id,
      coupon_code: 'STALE-1',
      expires_at: new Date('2019-06-01'),
      is_redeemed: false,
    })

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'expcoupdev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id, current_sprint_xp: 200 })

    const res = await request(app)
      .post(`/api/rewards/${rewardRes.body.reward.id}/purchase`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(400)
    const purchases = await db('purchases').where({ user_id: devUser.id })
    expect(purchases).toHaveLength(0)
  })
})
