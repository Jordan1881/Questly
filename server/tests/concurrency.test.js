require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  await db('xp_transactions').del()
  await db('task_assignments').del()
  await db('tasks').del()
  await db('purchases').del()
  await db('reward_coupons').del()
  await db('rewards').del()
  await db('sprints').del()
  await db('users').del()
  await db('workspaces').del()
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

describe('concurrent task completion', () => {
  test('10 developers complete different tasks in parallel — XP sums correctly', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'conc')
    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Concurrent WS' })
    const workspace = workspaceRes.body.workspace

    const devs = []
    const taskIds = []

    for (let i = 0; i < 10; i += 1) {
      const dev = await registerAndLogin('developer', `conc${i}`)
      await db('users').where({ id: dev.user.id }).update({ workspace_id: workspace.id })
      devs.push(dev)

      const [task] = await db('tasks')
        .insert({
          workspace_id: workspace.id,
          jira_issue_id: `conc-task-${i}`,
          jira_issue_key: `C-${i}`,
          title: `Task ${i}`,
          difficulty: 'easy',
          xp_reward: 20,
          status: 'to_do',
        })
        .returning('*')
      await db('task_assignments').insert({ task_id: task.id, user_id: dev.user.id })
      taskIds.push(task.id)
    }

    const results = await Promise.all(
      devs.map((dev, i) =>
        request(app)
          .patch(`/api/tasks/${taskIds[i]}/completion`)
          .set('Authorization', `Bearer ${dev.token}`)
          .send({ completed: true }),
      ),
    )

    results.forEach((res) => expect(res.status).toBe(200))

    const users = await db('users').where({ workspace_id: workspace.id })
    const totalXp = users.reduce((sum, u) => sum + u.current_sprint_xp, 0)
    expect(totalXp).toBe(200)

    users.forEach((u) => {
      expect(u.current_sprint_xp).toBeGreaterThanOrEqual(0)
      expect(u.lifetime_xp).toBe(20)
    })
  }, 30000)
})

describe('concurrent reward purchase', () => {
  test('5 parallel purchases for last coupon — exactly one succeeds', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'race')
    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Race WS' })
    const workspace = workspaceRes.body.workspace

    const rewardRes = await request(app)
      .post(`/api/workspaces/${workspace.id}/rewards`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Last coupon', description: 'x', xpCost: 10 })
    const rewardId = rewardRes.body.reward.id

    await request(app)
      .post(`/api/rewards/${rewardId}/coupons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ couponCodes: ['ONLY-ONE'] })

    const buyers = []
    for (let i = 0; i < 5; i += 1) {
      const dev = await registerAndLogin('developer', `race${i}`)
      await db('users')
        .where({ id: dev.user.id })
        .update({ workspace_id: workspace.id, current_sprint_xp: 50 })
      buyers.push(dev)
    }

    const results = await Promise.all(
      buyers.map((dev) =>
        request(app)
          .post(`/api/rewards/${rewardId}/purchase`)
          .set('Authorization', `Bearer ${dev.token}`),
      ),
    )

    const successes = results.filter((r) => r.status === 201)
    const failures = results.filter((r) => r.status === 400)
    expect(successes).toHaveLength(1)
    expect(failures).toHaveLength(4)

    const redeemed = await db('reward_coupons').where({ reward_id: rewardId, is_redeemed: true })
    expect(redeemed).toHaveLength(1)
  })
})
