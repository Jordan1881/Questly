require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const { isExpired } = require('../services/coupon')

const app = createApp()

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  await db('xp_transactions').del()
  await db('purchases').del()
  await db('reward_coupons').del()
  await db('rewards').del()
  await db('join_requests').del()
  await db('sprints').del()
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

async function createReward(workspaceId, adminToken, overrides = {}) {
  const res = await request(app)
    .post(`/api/workspaces/${workspaceId}/rewards`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Coffee voucher',
      description: 'Free coffee',
      xpCost: 40,
      imageUrl: 'https://example.com/coffee.png',
      ...overrides,
    })
  return res.body.reward
}

describe('POST /api/workspaces/:id/rewards', () => {
  test('admin creates reward', async () => {
    const { token } = await registerAndLogin('admin', 'create')
    const workspace = await createWorkspace(token, 'create')

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/rewards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Gift card', description: 'Nice', xpCost: 50 })

    expect(res.status).toBe(201)
    expect(res.body.reward).toMatchObject({
      title: 'Gift card',
      xpCost: 50,
      stockCount: 0,
      isAvailable: true,
    })
  })

  test('rejects invalid xpCost', async () => {
    const { token } = await registerAndLogin('admin', 'badxp')
    const workspace = await createWorkspace(token, 'badxp')

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/rewards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bad', xpCost: 0 })

    expect(res.status).toBe(400)
  })

  test('developer cannot create reward', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'devcreate')
    const workspace = await createWorkspace(adminToken, 'devcreate')
    const { token: devToken } = await registerAndLogin('developer', 'devcreate2')

    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/rewards`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ title: 'Nope', xpCost: 10 })

    expect(res.status).toBe(403)
  })
})

describe('GET /api/workspaces/:id/rewards', () => {
  test('member lists available rewards with stock counts', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'list')
    const workspace = await createWorkspace(adminToken, 'list')
    const reward = await createReward(workspace.id, adminToken)

    await request(app)
      .post(`/api/rewards/${reward.id}/coupons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ couponCodes: ['CODE-1', 'CODE-2'] })

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'listdev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id })

    const res = await request(app)
      .get(`/api/workspaces/${workspace.id}/rewards`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(200)
    expect(res.body.rewards).toHaveLength(1)
    expect(res.body.rewards[0].stockCount).toBe(2)
  })
})

describe('PATCH /api/rewards/:id', () => {
  test('admin updates reward', async () => {
    const { token } = await registerAndLogin('admin', 'patch')
    const workspace = await createWorkspace(token, 'patch')
    const reward = await createReward(workspace.id, token)

    const res = await request(app)
      .patch(`/api/rewards/${reward.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated title', xpCost: 60 })

    expect(res.status).toBe(200)
    expect(res.body.reward.title).toBe('Updated title')
    expect(res.body.reward.xpCost).toBe(60)
  })
})

describe('DELETE /api/rewards/:id', () => {
  test('blocks delete when unredeemed coupons remain', async () => {
    const { token } = await registerAndLogin('admin', 'delblock')
    const workspace = await createWorkspace(token, 'delblock')
    const reward = await createReward(workspace.id, token)

    await request(app)
      .post(`/api/rewards/${reward.id}/coupons`)
      .set('Authorization', `Bearer ${token}`)
      .send({ couponCodes: ['KEEP-ME'] })

    const res = await request(app)
      .delete(`/api/rewards/${reward.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })

  test('allows delete when no unredeemed coupons remain', async () => {
    const { token } = await registerAndLogin('admin', 'delok')
    const workspace = await createWorkspace(token, 'delok')
    const reward = await createReward(workspace.id, token)

    const res = await request(app)
      .delete(`/api/rewards/${reward.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
  })
})

describe('POST /api/rewards/:id/coupons', () => {
  test('admin uploads coupon codes with default expiry', async () => {
    const { token } = await registerAndLogin('admin', 'coupons')
    const workspace = await createWorkspace(token, 'coupons')
    const reward = await createReward(workspace.id, token)

    const res = await request(app)
      .post(`/api/rewards/${reward.id}/coupons`)
      .set('Authorization', `Bearer ${token}`)
      .send({ couponCodes: 'ALPHA\nBETA\nALPHA' })

    expect(res.status).toBe(201)
    expect(res.body.coupons).toEqual({ added: 2, skipped: 1 })
    expect(res.body.reward.stockCount).toBe(2)
  })
})

describe('POST /api/rewards/:id/purchase', () => {
  test('purchase deducts XP and redeems coupon', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'buy')
    const workspace = await createWorkspace(adminToken, 'buy')
    const reward = await createReward(workspace.id, adminToken, { xpCost: 30 })

    await request(app)
      .post(`/api/rewards/${reward.id}/coupons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ couponCodes: ['BUY-1'] })

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'buydev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id, current_sprint_xp: 100 })

    const res = await request(app)
      .post(`/api/rewards/${reward.id}/purchase`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(201)
    expect(res.body.purchase.couponCode).toBe('BUY-1')
    expect(res.body.balances.current_sprint_xp).toBe(70)

    const tx = await db('xp_transactions').where({ user_id: devUser.id, reason: 'reward_purchased' }).first()
    expect(tx.amount).toBe(-30)
  })

  test('purchase returns 400 when insufficient XP', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'poor')
    const workspace = await createWorkspace(adminToken, 'poor')
    const reward = await createReward(workspace.id, adminToken, { xpCost: 80 })

    await request(app)
      .post(`/api/rewards/${reward.id}/coupons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ couponCodes: ['POOR-1'] })

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'poordev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id, current_sprint_xp: 10 })

    const res = await request(app)
      .post(`/api/rewards/${reward.id}/purchase`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Insufficient/)
  })

  test('purchase returns 400 when coupons expired', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'expired')
    const workspace = await createWorkspace(adminToken, 'expired')
    const reward = await createReward(workspace.id, adminToken, { xpCost: 20 })

    const past = new Date('2020-01-01T00:00:00.000Z')
    expect(isExpired(past)).toBe(true)

    await request(app)
      .post(`/api/rewards/${reward.id}/coupons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ couponCodes: ['OLD-1'], expiresAt: past.toISOString() })

    const { token: devToken, user: devUser } = await registerAndLogin('developer', 'expdev')
    await db('users').where({ id: devUser.id }).update({ workspace_id: workspace.id, current_sprint_xp: 100 })

    const res = await request(app)
      .post(`/api/rewards/${reward.id}/purchase`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(400)

    const row = await db('rewards').where({ id: reward.id }).first()
    expect(row.is_available).toBe(false)
  })
})
