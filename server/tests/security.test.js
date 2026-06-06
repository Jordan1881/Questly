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
  await db('join_requests').del()
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
    .send({ name: `Workspace ${suffix}` })
  return res.body.workspace
}

describe('security access control', () => {
  test('unauthenticated GET /api/workspaces/:id/members receives 401', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'sec2')
    const workspace = await createWorkspace(adminToken, 'sec2')

    const res = await request(app).get(`/api/workspaces/${workspace.id}/members`)

    expect(res.status).toBe(401)
  })

  test('developer calling admin join-request list receives 403', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'sec3')
    const workspace = await createWorkspace(adminToken, 'sec3')
    const { token: devToken } = await registerAndLogin('developer', 'sec3')

    const res = await request(app)
      .get(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(403)
  })

  test('cross-workspace GET /api/tasks/:id returns 403', async () => {
    const { token: adminA } = await registerAndLogin('admin', 'wsa')
    const wsA = await createWorkspace(adminA, 'wsa')
    const { token: devA, user: devUserA } = await registerAndLogin('developer', 'wsadev')
    await db('users').where({ id: devUserA.id }).update({ workspace_id: wsA.id })

    const [task] = await db('tasks')
      .insert({
        workspace_id: wsA.id,
        jira_issue_id: 'sec-a-1',
        jira_issue_key: 'A-1',
        title: 'Secret task',
        difficulty: 'easy',
        xp_reward: 20,
        status: 'to_do',
      })
      .returning('*')
    await db('task_assignments').insert({ task_id: task.id, user_id: devUserA.id })

    const { token: devB, user: devUserB } = await registerAndLogin('developer', 'wsbdev')
    const { token: adminB } = await registerAndLogin('admin', 'wsb')
    const wsB = await createWorkspace(adminB, 'wsb')
    await db('users').where({ id: devUserB.id }).update({ workspace_id: wsB.id })

    const res = await request(app)
      .get(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${devB}`)

    expect(res.status).toBe(403)
  })

  test('task completion in wrong workspace returns 403', async () => {
    const { token: adminA } = await registerAndLogin('admin', 'tca')
    const wsA = await createWorkspace(adminA, 'tca')
    const { token: devA, user: devUserA } = await registerAndLogin('developer', 'tcadev')
    await db('users').where({ id: devUserA.id }).update({ workspace_id: wsA.id })

    const [task] = await db('tasks')
      .insert({
        workspace_id: wsA.id,
        jira_issue_id: 'sec-tc-1',
        jira_issue_key: 'TC-1',
        title: 'Other workspace task',
        difficulty: 'medium',
        xp_reward: 40,
        status: 'to_do',
      })
      .returning('*')
    await db('task_assignments').insert({ task_id: task.id, user_id: devUserA.id })

    const { token: devB, user: devUserB } = await registerAndLogin('developer', 'tcbdev')
    const { token: adminB } = await registerAndLogin('admin', 'tcb')
    const wsB = await createWorkspace(adminB, 'tcb')
    await db('users').where({ id: devUserB.id }).update({ workspace_id: wsB.id })

    const res = await request(app)
      .patch(`/api/tasks/${task.id}/completion`)
      .set('Authorization', `Bearer ${devB}`)
      .send({ completed: true })

    expect(res.status).toBe(403)
  })

  test('developer closing sprint receives 403', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'sprintclose')
    const workspace = await createWorkspace(adminToken, 'sprintclose')
    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'sprintclosedev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    const created = await request(app)
      .post(`/api/workspaces/${workspace.id}/sprints`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Sprint' })

    const res = await request(app)
      .post(`/api/sprints/${created.body.sprint.id}/close`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(403)
  })

  test('SQL injection in task filter query is safely parameterized', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'sqli')
    const workspace = await createWorkspace(adminToken, 'sqli')

    const res = await request(app)
      .get(`/api/workspaces/${workspace.id}/tasks?difficulty=' OR 1=1 --`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.tasks).toEqual([])
  })

  test('no JWT on protected route GET /api/tasks returns 401', async () => {
    const res = await request(app).get('/api/tasks')
    expect(res.status).toBe(401)
  })
})
