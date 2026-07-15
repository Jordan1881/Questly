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

describe('MULTI_WORKSPACE multi-membership', () => {
  test('user with one workspace can create another and list memberships', async () => {
    const user = await register('multi-owner@test.com', 'multiowner')

    const first = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Alpha' })
    expect(first.status).toBe(201)

    await db('users').where({ id: user.user.id }).update({
      lifetime_xp: 100,
      coin_balance: 10,
      current_sprint_xp: 40,
    })
    await db('workspace_memberships')
      .where({ user_id: user.user.id, workspace_id: first.body.workspace.id })
      .update({ lifetime_xp: 100, coin_balance: 10, current_sprint_xp: 40 })

    const second = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Beta' })
    expect(second.status).toBe(201)
    expect(second.body.workspace.name).toBe('Beta')
    expect(second.body.memberships).toHaveLength(2)

    const betaMembership = await db('workspace_memberships')
      .where({ user_id: user.user.id, workspace_id: second.body.workspace.id })
      .first()
    expect(betaMembership).toMatchObject({
      role: 'admin',
      status: 'active',
      lifetime_xp: 0,
      coin_balance: 0,
      current_sprint_xp: 0,
    })

    const listed = await request(app)
      .get('/api/workspaces/memberships')
      .set('Authorization', `Bearer ${user.token}`)

    expect(listed.status).toBe(200)
    expect(listed.body.memberships).toHaveLength(2)
    expect(listed.body.memberships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workspace_id: first.body.workspace.id,
          role: 'admin',
          is_owner: true,
          workspace: expect.objectContaining({
            name: 'Alpha',
            jira_project_key: null,
            team_jira_site_host: null,
            team_jira_connected: false,
          }),
        }),
        expect.objectContaining({
          workspace_id: second.body.workspace.id,
          role: 'admin',
          is_owner: true,
          workspace: expect.objectContaining({ name: 'Beta' }),
        }),
      ])
    )
    expect(listed.body.memberships[0]).toHaveProperty('last_used_at')
  })

  test('member can request to join a second workspace; second pending is rejected', async () => {
    const ownerA = await register('owner-a@test.com', 'ownera')
    const ownerB = await register('owner-b@test.com', 'ownerb')
    const member = await register('member@test.com', 'memberx')

    const wsA = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ name: 'Team A' })
    const wsB = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${ownerB.token}`)
      .send({ name: 'Team B' })

    const joinA = await request(app)
      .post(`/api/workspaces/${wsA.body.workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({})
    expect(joinA.status).toBe(201)

    const pendingA = await db('join_requests')
      .where({ user_id: member.user.id, workspace_id: wsA.body.workspace.id })
      .first()

    const approveA = await request(app)
      .patch(`/api/workspaces/${wsA.body.workspace.id}/join-requests/${pendingA.id}`)
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ status: 'approved' })
    expect(approveA.status).toBe(200)

    const joinB = await request(app)
      .post(`/api/workspaces/${wsB.body.workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({})
    expect(joinB.status).toBe(201)

    const joinBAgain = await request(app)
      .post(`/api/workspaces/${wsB.body.workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({})
    expect(joinBAgain.status).toBe(409)
    expect(joinBAgain.body.error).toMatch(/pending join request/i)

    // Already a member of A — membership check wins before the global pending rule
    const rejoinA = await request(app)
      .post(`/api/workspaces/${wsA.body.workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({})
    expect(rejoinA.status).toBe(400)
    expect(rejoinA.body.error).toMatch(/already belong to this workspace/i)

    // Create a third workspace to assert the global pending cap
    const ownerC = await register('owner-c@test.com', 'ownerc')
    const wsC = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${ownerC.token}`)
      .send({ name: 'Team C' })
    const pendingC = await request(app)
      .post(`/api/workspaces/${wsC.body.workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({})
    expect(pendingC.status).toBe(409)
    expect(pendingC.body.error).toMatch(/pending join request/i)

    const pendingCount = await db('join_requests')
      .where({ user_id: member.user.id, status: 'pending' })
      .count('* as count')
      .first()
    expect(Number(pendingCount.count)).toBe(1)

    const pendingB = await db('join_requests')
      .where({ user_id: member.user.id, workspace_id: wsB.body.workspace.id, status: 'pending' })
      .first()

    const approveB = await request(app)
      .patch(`/api/workspaces/${wsB.body.workspace.id}/join-requests/${pendingB.id}`)
      .set('Authorization', `Bearer ${ownerB.token}`)
      .send({ status: 'approved' })
    expect(approveB.status).toBe(200)

    const memberships = await request(app)
      .get('/api/workspaces/memberships')
      .set('Authorization', `Bearer ${member.token}`)
    expect(memberships.status).toBe(200)
    expect(memberships.body.memberships).toHaveLength(2)
    expect(memberships.body.memberships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ workspace_id: wsA.body.workspace.id, role: 'developer' }),
        expect.objectContaining({ workspace_id: wsB.body.workspace.id, role: 'developer' }),
      ])
    )
  })

  test('flag off: list memberships is unavailable; already-belong still blocks join', async () => {
    delete process.env.MULTI_WORKSPACE

    const admin = await request(app).post('/api/auth/register').send({
      email: 'off-admin@test.com',
      username: 'offadmin',
      password: 'password123',
      role: 'admin',
    })
    const workspace = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${admin.body.token}`)
      .send({ name: 'Solo' })

    const listed = await request(app)
      .get('/api/workspaces/memberships')
      .set('Authorization', `Bearer ${admin.body.token}`)
    expect(listed.status).toBe(404)

    const dev = await request(app).post('/api/auth/register').send({
      email: 'off-dev@test.com',
      username: 'offdev',
      password: 'password123',
      role: 'developer',
    })
    await db('users').where({ id: dev.body.user.id }).update({
      workspace_id: workspace.body.workspace.id,
    })

    const join = await request(app)
      .post(`/api/workspaces/${workspace.body.workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${dev.body.token}`)
      .send({})
    expect(join.status).toBe(400)
    expect(join.body.error).toMatch(/already belong to a workspace/i)

    process.env.MULTI_WORKSPACE = 'true'
  })
})
