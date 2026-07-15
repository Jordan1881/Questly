require('dotenv').config()

process.env.MULTI_WORKSPACE = 'true'

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
  const res = await request(app).post('/api/auth/register').send({
    email,
    username,
    password: 'password123',
  })
  expect(res.status).toBe(201)
  return res.body
}

async function seedAssignedTask({ workspaceId, developerId, xp = 40 }) {
  const [task] = await db('tasks')
    .insert({
      workspace_id: workspaceId,
      jira_issue_id: `KEY-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      jira_issue_key: 'TEST-1',
      title: 'Header scoped task',
      description: '',
      difficulty: 'medium',
      xp_reward: xp,
      status: 'to_do',
      high_priority: false,
    })
    .returning('*')

  await db('task_assignments').insert({
    task_id: task.id,
    user_id: developerId,
  })

  return task
}

describe('X-Workspace-Id context + membership XP', () => {
  test('missing/wrong header is 403; valid header lists tasks and awards membership XP', async () => {
    const owner = await register('ctx-owner@test.com', 'ctxowner')
    const wsA = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Space A' })
    const wsB = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Space B' })

    const member = await register('ctx-dev@test.com', 'ctxdev')
    const join = await request(app)
      .post(`/api/workspaces/${wsA.body.workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({})
    const pending = await db('join_requests').where({ user_id: member.user.id }).first()
    await request(app)
      .patch(`/api/workspaces/${wsA.body.workspace.id}/join-requests/${pending.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ status: 'approved' })

    const task = await seedAssignedTask({
      workspaceId: wsA.body.workspace.id,
      developerId: member.user.id,
      xp: 40,
    })

    const missing = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${member.token}`)
    expect(missing.status).toBe(403)

    const wrong = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${member.token}`)
      .set('X-Workspace-Id', wsB.body.workspace.id)
    expect(wrong.status).toBe(403)

    const listed = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${member.token}`)
      .set('X-Workspace-Id', wsA.body.workspace.id)
    expect(listed.status).toBe(200)
    expect(listed.body.tasks).toHaveLength(1)

    const before = await db('workspace_memberships')
      .where({ user_id: member.user.id, workspace_id: wsA.body.workspace.id })
      .first()

    const completed = await request(app)
      .patch(`/api/tasks/${task.id}/completion`)
      .set('Authorization', `Bearer ${member.token}`)
      .set('X-Workspace-Id', wsA.body.workspace.id)
      .send({ completed: true })

    expect(completed.status).toBe(200)
    expect(completed.body.user.lifetime_xp).toBe((before.lifetime_xp || 0) + 40)
    expect(completed.body.user.coin_balance).toBe((before.coin_balance || 0) + 4)

    const afterA = await db('workspace_memberships')
      .where({ user_id: member.user.id, workspace_id: wsA.body.workspace.id })
      .first()
    expect(afterA.lifetime_xp).toBe((before.lifetime_xp || 0) + 40)
    expect(afterA.last_used_at).toBeTruthy()

    // Joining B later: balances stay isolated on A
    const joinB = await request(app)
      .post(`/api/workspaces/${wsB.body.workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({})
    const pendingB = await db('join_requests')
      .where({ user_id: member.user.id, workspace_id: wsB.body.workspace.id })
      .first()
    await request(app)
      .patch(`/api/workspaces/${wsB.body.workspace.id}/join-requests/${pendingB.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ status: 'approved' })

    const membershipB = await db('workspace_memberships')
      .where({ user_id: member.user.id, workspace_id: wsB.body.workspace.id })
      .first()
    expect(membershipB.lifetime_xp).toBe(0)

    const dashA = await request(app)
      .get('/api/users/me/dashboard')
      .set('Authorization', `Bearer ${member.token}`)
      .set('X-Workspace-Id', wsA.body.workspace.id)
    expect(dashA.status).toBe(200)
    expect(dashA.body.xp.lifetime_xp).toBe(afterA.lifetime_xp)

    const dashB = await request(app)
      .get('/api/users/me/dashboard')
      .set('Authorization', `Bearer ${member.token}`)
      .set('X-Workspace-Id', wsB.body.workspace.id)
    expect(dashB.status).toBe(200)
    expect(dashB.body.xp.lifetime_xp).toBe(0)
  })

  test('flag off: tasks still work without X-Workspace-Id', async () => {
    delete process.env.MULTI_WORKSPACE

    const admin = await request(app).post('/api/auth/register').send({
      email: 'flagoff-admin@test.com',
      username: 'flagoffadmin',
      password: 'password123',
      role: 'admin',
    })
    const workspace = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${admin.body.token}`)
      .send({ name: 'Legacy' })

    const dev = await request(app).post('/api/auth/register').send({
      email: 'flagoff-dev@test.com',
      username: 'flagoffdev',
      password: 'password123',
      role: 'developer',
    })
    await db('users').where({ id: dev.body.user.id }).update({
      workspace_id: workspace.body.workspace.id,
    })
    await db('workspace_memberships').insert({
      user_id: dev.body.user.id,
      workspace_id: workspace.body.workspace.id,
      role: 'developer',
      status: 'active',
    })

    const task = await seedAssignedTask({
      workspaceId: workspace.body.workspace.id,
      developerId: dev.body.user.id,
    })

    const listed = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${dev.body.token}`)
    expect(listed.status).toBe(200)
    expect(listed.body.tasks[0].id).toBe(task.id)

    process.env.MULTI_WORKSPACE = 'true'
  })
})
