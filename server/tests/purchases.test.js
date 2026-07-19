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

async function seedPurchase(devLogin, adminToken, workspaceId) {
  const rewardRes = await request(app)
    .post(`/api/workspaces/${workspaceId}/rewards`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Gift Card', description: 'Nice', coinCost: 2 })

  const reward = rewardRes.body.reward

  await request(app)
    .post(`/api/rewards/${reward.id}/coupons`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ couponCodes: ['SAVE-ME-1234'] })

  await db('users').where({ id: devLogin.user.id }).update({ workspace_id: workspaceId, coin_balance: 100 })

  const purchaseRes = await request(app)
    .post(`/api/rewards/${reward.id}/purchase`)
    .set('Authorization', `Bearer ${devLogin.token}`)
    .send()

  return { reward, purchase: purchaseRes.body.purchase }
}

describe('GET /api/users/me/purchases', () => {
  test('lists purchases with coupon and reward details', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'plist')
    const workspace = (
      await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'WS' })
    ).body.workspace

    const dev = await registerAndLogin('developer', 'plistdev')
    const { purchase } = await seedPurchase(dev, adminToken, workspace.id)

    const res = await request(app)
      .get('/api/users/me/purchases')
      .set('Authorization', `Bearer ${dev.token}`)

    expect(res.status).toBe(200)
    expect(res.body.purchases).toHaveLength(1)
    expect(res.body.purchases[0]).toMatchObject({
      id: purchase.id,
      rewardTitle: 'Gift Card',
      couponCode: 'SAVE-ME-1234',
      coinsSpent: 2,
    })
  })
})

describe('DELETE /api/users/me/purchases/:id', () => {
  test('soft deletes purchase and excludes from list', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'pdel')
    const workspace = (
      await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'WS' })
    ).body.workspace

    const dev = await registerAndLogin('developer', 'pdeldev')
    const { reward, purchase } = await seedPurchase(dev, adminToken, workspace.id)

    // The sole coupon was burned on purchase, which auto-disables the reward.
    const couponBefore = await db('reward_coupons').where({ reward_id: reward.id }).first()
    expect(couponBefore.is_redeemed).toBe(true)
    const rewardBefore = await db('rewards').where({ id: reward.id }).first()
    expect(rewardBefore.is_available).toBe(false)

    const delRes = await request(app)
      .delete(`/api/users/me/purchases/${purchase.id}`)
      .set('Authorization', `Bearer ${dev.token}`)

    expect(delRes.status).toBe(200)
    expect(delRes.body.purchase.deletedAt).toBeTruthy()

    const row = await db('purchases').where({ id: purchase.id }).first()
    expect(row.deleted_at).not.toBeNull()

    // Undoing the purchase restocks the coupon and re-opens the reward.
    const couponAfter = await db('reward_coupons').where({ id: couponBefore.id }).first()
    expect(couponAfter.is_redeemed).toBe(false)
    const rewardAfter = await db('rewards').where({ id: reward.id }).first()
    expect(rewardAfter.is_available).toBe(true)

    const listRes = await request(app)
      .get('/api/users/me/purchases')
      .set('Authorization', `Bearer ${dev.token}`)

    expect(listRes.body.purchases).toHaveLength(0)
  })

  test('returns 404 for another users purchase', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'p403')
    const workspace = (
      await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'WS' })
    ).body.workspace

    const dev1 = await registerAndLogin('developer', 'p403a')
    const dev2 = await registerAndLogin('developer', 'p403b')
    const { purchase } = await seedPurchase(dev1, adminToken, workspace.id)

    const res = await request(app)
      .delete(`/api/users/me/purchases/${purchase.id}`)
      .set('Authorization', `Bearer ${dev2.token}`)

    expect(res.status).toBe(404)
  })
})

describe('GET /api/users/me', () => {
  test('returns profile with purchases embedded', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'prof')
    const workspace = (
      await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'WS' })
    ).body.workspace

    const dev = await registerAndLogin('developer', 'profdev')
    await seedPurchase(dev, adminToken, workspace.id)

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${dev.token}`)

    expect(res.status).toBe(200)
    expect(res.body.profile.username).toBe('devprofdev')
    expect(res.body.profile.level).toBeGreaterThanOrEqual(1)
    expect(res.body.purchases).toHaveLength(1)
  })
})

describe('PATCH /api/users/me', () => {
  test('updates username', async () => {
    const dev = await registerAndLogin('developer', 'patch')

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${dev.token}`)
      .send({ username: 'newname' })

    expect(res.status).toBe(200)
    expect(res.body.profile.username).toBe('newname')
  })

  test('updates age and preferences', async () => {
    const dev = await registerAndLogin('developer', 'profilefields')

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${dev.token}`)
      .send({ age: 28, preferences: { levelUpNotifications: false } })

    expect(res.status).toBe(200)
    expect(res.body.profile.age).toBe(28)
    expect(res.body.profile.preferences.levelUpNotifications).toBe(false)
  })

  test('updates email with current password', async () => {
    const dev = await registerAndLogin('developer', 'emailchange')

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${dev.token}`)
      .send({
        email: 'newemail@test.com',
        currentPassword: 'password123',
      })

    expect(res.status).toBe(200)
    expect(res.body.profile.email).toBe('newemail@test.com')
  })

  test('rejects duplicate username', async () => {
    await registerAndLogin('developer', 'taken')
    const dev2 = await registerAndLogin('developer', 'patchdup')

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${dev2.token}`)
      .send({ username: 'devtaken' })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/users/me/avatar', () => {
  const sharp = require('sharp')
  let avatarPng

  beforeAll(async () => {
    avatarPng = await sharp({
      create: {
        width: 480,
        height: 480,
        channels: 3,
        background: { r: 148, g: 47, b: 205 },
      },
    })
      .png()
      .toBuffer()
  })

  test('uploads avatar image', async () => {
    const dev = await registerAndLogin('developer', 'avatar')

    const res = await request(app)
      .post('/api/users/me/avatar')
      .set('Authorization', `Bearer ${dev.token}`)
      .attach('avatar', avatarPng, 'avatar.png')

    expect(res.status).toBe(200)
    expect(res.body.profile.avatarUrl).toMatch(/^\/api\/uploads\/avatars\//)
  })
})
