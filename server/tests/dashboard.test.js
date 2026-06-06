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
  await db('sprints').del()
  await db('join_requests').del()
  await db('users').del()
  await db('workspaces').del()
})

afterAll(async () => {
  await db.destroy()
})

async function registerAndLogin(role = 'developer', suffix = '') {
  const email = `dash${suffix}@test.com`
  await request(app)
    .post('/api/auth/register')
    .send({ email, username: `dash${suffix}`, password: 'password123', role })
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' })
  return { token: res.body.token, user: res.body.user }
}

describe('GET /api/users/me/dashboard', () => {
  it('aggregates XP, streak, active sprint, and high-priority tasks', async () => {
    const { token: adminToken, user: adminUser } = await registerAndLogin('admin', 'dash-admin')
    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dash WS' })
    const workspaceId = workspaceRes.body.workspace.id

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'dash-dev')
    await db('users')
      .where({ id: devUser.id })
      .update({
        workspace_id: workspaceId,
        current_sprint_xp: 450,
        lifetime_xp: 1450,
        coin_balance: 14,
        streak_days: 4,
      })

    await request(app)
      .post(`/api/workspaces/${workspaceId}/sprints`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dash Sprint', startDate: '2026-06-01', endDate: '2026-06-30' })

    const [task] = await db('tasks')
      .insert({
        workspace_id: workspaceId,
        jira_issue_id: 'dash-1',
        jira_issue_key: 'DASH-1',
        title: 'Urgent fix',
        difficulty: 'hard',
        xp_reward: 70,
        high_priority: true,
        status: 'to_do',
      })
      .returning('*')

    await db('task_assignments').insert({ task_id: task.id, user_id: devUser.id })

    const res = await request(app)
      .get('/api/users/me/dashboard')
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(200)
    expect(res.body.xp).toMatchObject({
      current_sprint_xp: 450,
      lifetime_xp: 1450,
      coin_balance: 14,
      level: 2,
    })
    expect(res.body.streak).toBe(4)
    expect(res.body.activeSprint).toMatchObject({ name: 'Dash Sprint', status: 'active' })
    expect(res.body.highPriorityTasks).toHaveLength(1)
    expect(res.body.highPriorityTasks[0].title).toBe('Urgent fix')

    expect(adminUser.id).toBeTruthy()
  })
})
