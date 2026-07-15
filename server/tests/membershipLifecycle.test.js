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

async function createWorkspace(token, name) {
  const res = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${token}`)
    .send({ name })
  expect(res.status).toBe(201)
  return res.body.workspace
}

async function approveJoin(ownerToken, workspaceId, requestId) {
  const res = await request(app)
    .patch(`/api/workspaces/${workspaceId}/join-requests/${requestId}`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ status: 'approved' })
  expect(res.status).toBe(200)
  return res.body
}

describe('MULTI_WORKSPACE membership lifecycle', () => {
  test('owner can promote and demote; co-admin cannot', async () => {
    const owner = await register('owner-life@test.com', 'ownerlife')
    const developer = await register('dev-life@test.com', 'devlife')
    const coAdmin = await register('coadmin-life@test.com', 'coadminlife')

    const workspace = await createWorkspace(owner.token, 'Life HQ')

    for (const user of [developer, coAdmin]) {
      const byCode = await request(app)
        .get(`/api/workspaces/by-code/${workspace.code}`)
        .set('Authorization', `Bearer ${user.token}`)
      expect(byCode.status).toBe(200)

      const join = await request(app)
        .post(`/api/workspaces/${workspace.id}/join-requests`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({})
      expect(join.status).toBe(201)
      await approveJoin(owner.token, workspace.id, join.body.join_request.id)
    }

    const promoteCo = await request(app)
      .patch(`/api/workspaces/${workspace.id}/members/${coAdmin.user.id}/role`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ role: 'admin' })
    expect(promoteCo.status).toBe(200)
    expect(promoteCo.body.membership.role).toBe('admin')
    expect(promoteCo.body.membership.is_owner).toBe(false)

    const coTriesPromote = await request(app)
      .patch(`/api/workspaces/${workspace.id}/members/${developer.user.id}/role`)
      .set('Authorization', `Bearer ${coAdmin.token}`)
      .send({ role: 'admin' })
    expect(coTriesPromote.status).toBe(403)

    const promoteDev = await request(app)
      .patch(`/api/workspaces/${workspace.id}/members/${developer.user.id}/role`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ role: 'admin' })
    expect(promoteDev.status).toBe(200)

    const demoteDev = await request(app)
      .patch(`/api/workspaces/${workspace.id}/members/${developer.user.id}/role`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ role: 'developer' })
    expect(demoteDev.status).toBe(200)
    expect(demoteDev.body.membership.role).toBe('developer')

    // Co-admin can use day-to-day admin APIs
    const members = await request(app)
      .get(`/api/workspaces/${workspace.id}/members`)
      .set('Authorization', `Bearer ${coAdmin.token}`)
    expect(members.status).toBe(200)
    expect(members.body.members.length).toBeGreaterThanOrEqual(3)

    // Co-admin cannot disconnect Jira or transfer ownership
    const disconnect = await request(app)
      .delete(`/api/workspaces/${workspace.id}/jira/disconnect`)
      .set('Authorization', `Bearer ${coAdmin.token}`)
    expect(disconnect.status).toBe(403)

    const coTriesTransfer = await request(app)
      .post(`/api/workspaces/${workspace.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${coAdmin.token}`)
      .send({ userId: developer.user.id })
    expect(coTriesTransfer.status).toBe(403)

    const ownerDisconnect = await request(app)
      .delete(`/api/workspaces/${workspace.id}/jira/disconnect`)
      .set('Authorization', `Bearer ${owner.token}`)
    expect(ownerDisconnect.status).toBe(200)
  })

  test('leave deactivates membership with balances retained; owner leave blocked until transfer', async () => {
    const owner = await register('owner-leave@test.com', 'ownerleave')
    const developer = await register('dev-leave@test.com', 'devleave')
    const coAdmin = await register('coadmin-leave@test.com', 'coadminleave')

    const workspace = await createWorkspace(owner.token, 'Leave Lab')

    for (const user of [developer, coAdmin]) {
      const join = await request(app)
        .post(`/api/workspaces/${workspace.id}/join-requests`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({})
      expect(join.status).toBe(201)
      await approveJoin(owner.token, workspace.id, join.body.join_request.id)
    }

    await request(app)
      .patch(`/api/workspaces/${workspace.id}/members/${coAdmin.user.id}/role`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ role: 'admin' })

    await db('workspace_memberships')
      .where({ user_id: developer.user.id, workspace_id: workspace.id })
      .update({ lifetime_xp: 120, coin_balance: 12, current_sprint_xp: 40 })

    const ownerLeaveBlocked = await request(app)
      .post(`/api/workspaces/${workspace.id}/leave`)
      .set('Authorization', `Bearer ${owner.token}`)
    expect(ownerLeaveBlocked.status).toBe(400)

    const leave = await request(app)
      .post(`/api/workspaces/${workspace.id}/leave`)
      .set('Authorization', `Bearer ${developer.token}`)
    expect(leave.status).toBe(200)
    expect(leave.body.membership.status).toBe('inactive')
    expect(leave.body.membership.lifetime_xp).toBe(120)
    expect(leave.body.membership.coin_balance).toBe(12)

    const membershipRow = await db('workspace_memberships')
      .where({ user_id: developer.user.id, workspace_id: workspace.id })
      .first()
    expect(membershipRow.status).toBe('inactive')
    expect(membershipRow.lifetime_xp).toBe(120)

    const members = await request(app)
      .get(`/api/workspaces/${workspace.id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
    expect(members.status).toBe(200)
    expect(members.body.members.map((m) => m.id)).not.toContain(developer.user.id)

    const listed = await request(app)
      .get('/api/workspaces/memberships')
      .set('Authorization', `Bearer ${developer.token}`)
    expect(listed.status).toBe(200)
    expect(listed.body.memberships).toHaveLength(0)

    const transferToDev = await request(app)
      .post(`/api/workspaces/${workspace.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userId: developer.user.id })
    expect(transferToDev.status).toBe(400)

    const transfer = await request(app)
      .post(`/api/workspaces/${workspace.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userId: coAdmin.user.id })
    expect(transfer.status).toBe(200)
    expect(transfer.body.new_owner_id).toBe(coAdmin.user.id)
    expect(transfer.body.previous_owner_id).toBe(owner.user.id)

    const workspaceRow = await db('workspaces').where({ id: workspace.id }).first()
    expect(workspaceRow.admin_id).toBe(coAdmin.user.id)

    const exOwnerMembership = await db('workspace_memberships')
      .where({ user_id: owner.user.id, workspace_id: workspace.id })
      .first()
    expect(exOwnerMembership).toMatchObject({ role: 'admin', status: 'active' })

    const ownerLeave = await request(app)
      .post(`/api/workspaces/${workspace.id}/leave`)
      .set('Authorization', `Bearer ${owner.token}`)
    expect(ownerLeave.status).toBe(200)
    expect(ownerLeave.body.membership.status).toBe('inactive')
  })

  test('rejoin reactivates inactive membership without resetting progress', async () => {
    const owner = await register('owner-rejoin@test.com', 'ownerrejoin')
    const developer = await register('dev-rejoin@test.com', 'devrejoin')

    const workspace = await createWorkspace(owner.token, 'Rejoin Lab')

    const join = await request(app)
      .post(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${developer.token}`)
      .send({})
    expect(join.status).toBe(201)
    await approveJoin(owner.token, workspace.id, join.body.join_request.id)

    await db('workspace_memberships')
      .where({ user_id: developer.user.id, workspace_id: workspace.id })
      .update({ lifetime_xp: 200, coin_balance: 20, current_sprint_xp: 50 })

    const leave = await request(app)
      .post(`/api/workspaces/${workspace.id}/leave`)
      .set('Authorization', `Bearer ${developer.token}`)
    expect(leave.status).toBe(200)

    const rejoin = await request(app)
      .post(`/api/workspaces/${workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${developer.token}`)
      .send({})
    expect(rejoin.status).toBe(201)
    await approveJoin(owner.token, workspace.id, rejoin.body.join_request.id)

    const membership = await db('workspace_memberships')
      .where({ user_id: developer.user.id, workspace_id: workspace.id })
      .first()
    expect(membership).toMatchObject({
      status: 'active',
      role: 'developer',
      lifetime_xp: 200,
      coin_balance: 20,
      current_sprint_xp: 50,
    })

    const listed = await request(app)
      .get('/api/workspaces/memberships')
      .set('Authorization', `Bearer ${developer.token}`)
    expect(listed.status).toBe(200)
    expect(listed.body.memberships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workspace_id: workspace.id,
          lifetime_xp: 200,
          coin_balance: 20,
        }),
      ])
    )
  })

  test('lifecycle endpoints 404 when MULTI_WORKSPACE is off', async () => {
    delete process.env.MULTI_WORKSPACE

    const adminRes = await request(app).post('/api/auth/register').send({
      email: 'admin-flagoff@test.com',
      username: 'adminflagoff',
      password: 'password123',
      role: 'admin',
    })
    expect(adminRes.status).toBe(201)

    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminRes.body.token}`)
      .send({ name: 'Flag Off' })
    expect(workspaceRes.status).toBe(201)

    const leave = await request(app)
      .post(`/api/workspaces/${workspaceRes.body.workspace.id}/leave`)
      .set('Authorization', `Bearer ${adminRes.body.token}`)
    expect(leave.status).toBe(404)

    process.env.MULTI_WORKSPACE = 'true'
  })
})
