require('dotenv').config()

process.env.MULTI_WORKSPACE = 'true'

const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const { cleanupCoreTables } = require('./helpers/cleanup')
const rewardPurchase = require('../services/rewardPurchase')

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

describe('rewardPurchase under MULTI_WORKSPACE', () => {
  test('deducts coins from workspace membership, not users.coin_balance', async () => {
    const owner = await register('rp-owner@test.com', 'rpowner')
    const ws = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Shop HQ' })
    expect(ws.status).toBe(201)

    const developer = await register('rp-dev@test.com', 'rpdev')
    await request(app)
      .post(`/api/workspaces/${ws.body.workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${developer.token}`)
      .send({})
    const pending = await db('join_requests').where({ user_id: developer.user.id }).first()
    await request(app)
      .patch(`/api/workspaces/${ws.body.workspace.id}/join-requests/${pending.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ status: 'approved' })

    await db('users').where({ id: developer.user.id }).update({ coin_balance: 999 })
    await db('workspace_memberships')
      .where({ user_id: developer.user.id, workspace_id: ws.body.workspace.id })
      .update({ coin_balance: 10 })

    const rewardRes = await request(app)
      .post(`/api/workspaces/${ws.body.workspace.id}/rewards`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Mug', coinCost: 4 })
    expect(rewardRes.status).toBe(201)
    const reward = rewardRes.body.reward

    await request(app)
      .post(`/api/rewards/${reward.id}/coupons`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ couponCodes: ['MW-BUY-1'] })

    const purchase = await request(app)
      .post(`/api/rewards/${reward.id}/purchase`)
      .set('Authorization', `Bearer ${developer.token}`)
      .set('X-Workspace-Id', ws.body.workspace.id)

    expect(purchase.status).toBe(201)
    expect(purchase.body.balances.coin_balance).toBe(6)

    const membership = await db('workspace_memberships')
      .where({ user_id: developer.user.id, workspace_id: ws.body.workspace.id })
      .first()
    expect(membership.coin_balance).toBe(6)

    const userRow = await db('users').where({ id: developer.user.id }).first()
    expect(userRow.coin_balance).toBe(999)
  })

  test('purchaseReward rejects missing active membership for workspace', async () => {
    const owner = await register('rp-forbid-owner@test.com', 'rpforbidowner')
    const ws = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Closed Shop' })
    const rewardRes = await request(app)
      .post(`/api/workspaces/${ws.body.workspace.id}/rewards`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Sticker', coinCost: 1 })
    await request(app)
      .post(`/api/rewards/${rewardRes.body.reward.id}/coupons`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ couponCodes: ['MW-FORBID-1'] })

    const stranger = await register('rp-stranger@test.com', 'rpstranger')

    await expect(
      rewardPurchase.purchaseReward({
        userId: stranger.user.id,
        rewardId: rewardRes.body.reward.id,
        workspaceId: ws.body.workspace.id,
      })
    ).rejects.toMatchObject({ status: 403, message: 'Forbidden' })
  })

  test('purchaseReward rejects insufficient membership coins', async () => {
    const owner = await register('rp-poor-owner@test.com', 'rppoorowner')
    const ws = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Broke Shop' })

    const developer = await register('rp-poor-dev@test.com', 'rppoordev')
    await request(app)
      .post(`/api/workspaces/${ws.body.workspace.id}/join-requests`)
      .set('Authorization', `Bearer ${developer.token}`)
      .send({})
    const pending = await db('join_requests').where({ user_id: developer.user.id }).first()
    await request(app)
      .patch(`/api/workspaces/${ws.body.workspace.id}/join-requests/${pending.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ status: 'approved' })

    await db('workspace_memberships')
      .where({ user_id: developer.user.id, workspace_id: ws.body.workspace.id })
      .update({ coin_balance: 1 })

    const rewardRes = await request(app)
      .post(`/api/workspaces/${ws.body.workspace.id}/rewards`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Laptop', coinCost: 50 })
    await request(app)
      .post(`/api/rewards/${rewardRes.body.reward.id}/coupons`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ couponCodes: ['MW-POOR-1'] })

    await expect(
      rewardPurchase.purchaseReward({
        userId: developer.user.id,
        rewardId: rewardRes.body.reward.id,
        workspaceId: ws.body.workspace.id,
      })
    ).rejects.toMatchObject({ status: 400, message: 'Insufficient coins' })
  })
})
