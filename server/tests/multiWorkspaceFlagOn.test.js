require('dotenv').config()

process.env.MULTI_WORKSPACE = 'true'

const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  process.env.MULTI_WORKSPACE = 'true'
  await db('join_requests').del()
  await db('workspace_memberships').del()
  await db('users').del()
  await db('workspaces').del()
})

afterEach(() => {
  process.env.MULTI_WORKSPACE = 'true'
})

afterAll(async () => {
  delete process.env.MULTI_WORKSPACE
  await db.destroy()
})

describe('MULTI_WORKSPACE flag on — role-less signup + memberships', () => {
  test('flag helper is enabled for this suite', () => {
    expect(isMultiWorkspaceEnabled()).toBe(true)
  })

  test('signup without role succeeds and returns empty membership context', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'roless@test.com',
      username: 'roless',
      password: 'password123',
    })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('roless@test.com')
    expect(res.body.memberships).toEqual([])
    expect(res.body.active_workspace_id).toBeNull()
  })

  test('role-less user can create workspace and becomes owner/admin membership', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'creator@test.com',
      username: 'creator',
      password: 'password123',
    })
    expect(reg.status).toBe(201)

    const created = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({ name: 'Creators Hub' })

    expect(created.status).toBe(201)
    expect(created.body.workspace.name).toBe('Creators Hub')
    expect(created.body.active_workspace_id).toBe(created.body.workspace.id)
    expect(created.body.memberships).toHaveLength(1)
    expect(created.body.memberships[0]).toMatchObject({
      workspace_id: created.body.workspace.id,
      role: 'admin',
      is_owner: true,
      status: 'active',
    })

    const membership = await db('workspace_memberships')
      .where({ user_id: reg.body.user.id, workspace_id: created.body.workspace.id })
      .first()
    expect(membership.role).toBe('admin')

    const userRow = await db('users').where({ id: reg.body.user.id }).first()
    expect(userRow.role).toBe('admin')
  })

  test('join approve creates developer membership and /me exposes context', async () => {
    const adminReg = await request(app).post('/api/auth/register').send({
      email: 'flag-admin@test.com',
      username: 'flagadmin',
      password: 'password123',
    })
    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminReg.body.token}`)
      .send({ name: 'Join Hub' })
    const workspace = workspaceRes.body.workspace

    const devReg = await request(app).post('/api/auth/register').send({
      email: 'flag-dev@test.com',
      username: 'flagdev',
      password: 'password123',
    })

    const submit = await request(app)
      .post(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${devReg.body.token}`)
      .send({})
    expect(submit.status).toBe(201)

    const pending = await db('join_requests')
      .where({ user_id: devReg.body.user.id, workspace_id: workspace.id })
      .first()

    const review = await request(app)
      .patch(`/api/workspaces/${workspace.id}/join-requests/${pending.id}`)
      .set('Authorization', `Bearer ${adminReg.body.token}`)
      .send({ status: 'approved' })

    expect(review.status).toBe(200)
    expect(review.body.membership).toMatchObject({
      workspace_id: workspace.id,
      role: 'developer',
      status: 'active',
      is_owner: false,
    })

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${devReg.body.token}`)

    expect(me.status).toBe(200)
    expect(me.body.active_workspace_id).toBe(workspace.id)
    expect(me.body.active_membership).toMatchObject({
      workspace_id: workspace.id,
      role: 'developer',
      is_owner: false,
    })
    expect(me.body.memberships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workspace_id: workspace.id,
          role: 'developer',
          status: 'active',
        }),
      ])
    )

    const mine = await request(app)
      .get('/api/workspaces/mine')
      .set('Authorization', `Bearer ${adminReg.body.token}`)
    expect(mine.status).toBe(200)
    expect(mine.body.workspace.id).toBe(workspace.id)
    expect(mine.body.memberships.length).toBeGreaterThanOrEqual(1)
    expect(mine.body.active_workspace_id).toBe(workspace.id)
  })
})
