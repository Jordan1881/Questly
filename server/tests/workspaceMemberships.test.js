require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const { backfillWorkspaceMemberships } = require('../lib/backfillWorkspaceMemberships')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  await db('join_requests').del()
  await db('workspace_memberships').del()
  await db('users').del()
  await db('workspaces').del()
})

afterAll(async () => {
  await db.destroy()
})

async function register(role, email, username) {
  const res = await request(app).post('/api/auth/register').send({
    email,
    username,
    password: 'password123',
    role,
  })
  expect(res.status).toBe(201)
  return res.body
}

describe('workspace memberships expand (flag off)', () => {
  test('feature flag stays off by default in this process', () => {
    expect(isMultiWorkspaceEnabled()).toBe(false)
  })

  test('creating a workspace dual-writes an admin membership', async () => {
    const { token, user } = await register('admin', 'owner@test.com', 'owner')
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Team A' })

    expect(res.status).toBe(201)
    const membership = await db('workspace_memberships')
      .where({ user_id: user.id, workspace_id: res.body.workspace.id })
      .first()

    expect(membership).toMatchObject({
      role: 'admin',
      status: 'active',
    })
  })

  test('backfill seeds owner + developer memberships and copies user progress once', async () => {
    const { user: admin } = await register('admin', 'backfill-admin@test.com', 'bfadmin')
    const { user: developer } = await register('developer', 'backfill-dev@test.com', 'bfdev')

    const [workspace] = await db('workspaces')
      .insert({ name: 'Legacy Team', admin_id: admin.id, code: 'LEGACY01' })
      .returning('*')

    await db('users').where({ id: developer.id }).update({
      workspace_id: workspace.id,
      current_sprint_xp: 40,
      lifetime_xp: 120,
      coin_balance: 12,
    })
    await db('users').where({ id: admin.id }).update({
      current_sprint_xp: 10,
      lifetime_xp: 50,
      coin_balance: 5,
    })

    await backfillWorkspaceMemberships(db)

    const adminMembership = await db('workspace_memberships')
      .where({ user_id: admin.id, workspace_id: workspace.id })
      .first()
    const devMembership = await db('workspace_memberships')
      .where({ user_id: developer.id, workspace_id: workspace.id })
      .first()

    expect(adminMembership).toMatchObject({
      role: 'admin',
      status: 'active',
      current_sprint_xp: 10,
      lifetime_xp: 50,
      coin_balance: 5,
    })
    expect(devMembership).toMatchObject({
      role: 'developer',
      status: 'active',
      current_sprint_xp: 40,
      lifetime_xp: 120,
      coin_balance: 12,
    })
  })

  test('approve join dual-writes developer membership with progress', async () => {
    const adminLogin = await register('admin', 'join-admin@test.com', 'joinadmin')
    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminLogin.token}`)
      .send({ name: 'Join Team' })
    const workspace = workspaceRes.body.workspace

    const devLogin = await register('developer', 'join-dev@test.com', 'joindev')
    await db('users').where({ id: devLogin.user.id }).update({
      lifetime_xp: 80,
      coin_balance: 8,
      current_sprint_xp: 20,
    })

    const submit = await request(app)
      .post(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${devLogin.token}`)
      .send({})
    expect(submit.status).toBe(201)

    const pending = await db('join_requests')
      .where({ user_id: devLogin.user.id, workspace_id: workspace.id })
      .first()

    const review = await request(app)
      .patch(`/api/workspaces/${workspace.id}/join-requests/${pending.id}`)
      .set('Authorization', `Bearer ${adminLogin.token}`)
      .send({ status: 'approved' })

    expect(review.status).toBe(200)

    const membership = await db('workspace_memberships')
      .where({ user_id: devLogin.user.id, workspace_id: workspace.id })
      .first()

    expect(membership).toMatchObject({
      role: 'developer',
      status: 'active',
      lifetime_xp: 80,
      coin_balance: 8,
      current_sprint_xp: 20,
    })
  })

  test('flag-off workspace create/list still uses legacy auth responses', async () => {
    const { token } = await register('admin', 'legacy@test.com', 'legacy')
    const created = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Legacy API' })
    expect(created.status).toBe(201)

    const mine = await request(app)
      .get('/api/workspaces/mine')
      .set('Authorization', `Bearer ${token}`)
    expect(mine.status).toBe(200)
    expect(mine.body.workspace.id).toBe(created.body.workspace.id)
    expect(mine.body.memberships).toBeUndefined()
  })

  test('flag-off /api/auth/me keeps legacy user shape (no memberships payload)', async () => {
    const { token, user } = await register('developer', 'me-legacy@test.com', 'melegacy')
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(me.status).toBe(200)
    expect(me.body.user).toMatchObject({
      id: user.id,
      email: 'me-legacy@test.com',
      role: 'developer',
      workspace_id: null,
    })
    expect(me.body.user.memberships).toBeUndefined()
    expect(me.body.memberships).toBeUndefined()
    expect(me.body.active_workspace_id).toBeUndefined()
  })
})
