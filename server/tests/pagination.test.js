const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const { parsePagination } = require('../lib/pagination')

const app = createApp()

describe('parsePagination (unit)', () => {
  test('is inactive when no params are given', () => {
    const p = parsePagination({})
    expect(p.active).toBe(false)
  })

  test('activates and clamps limit to maxLimit', () => {
    const p = parsePagination({ limit: '9999' }, { maxLimit: 200 })
    expect(p.active).toBe(true)
    expect(p.limit).toBe(200)
    expect(p.offset).toBe(0)
  })

  test('floors invalid values to safe defaults', () => {
    const p = parsePagination({ limit: 'abc', offset: '-5' })
    expect(p.active).toBe(true)
    expect(p.limit).toBe(50)
    expect(p.offset).toBe(0)
  })
})

describe('GET /api/workspaces/:id/tasks pagination', () => {
  let adminToken
  let workspaceId

  beforeAll(async () => {
    await db.migrate.latest()
  })

  beforeEach(async () => {
    await db('task_assignments').del()
    await db('tasks').del()
    await db('users').del()
    await db('workspaces').del()

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'admin-pg@test.com', username: 'adminpg', password: 'password123', role: 'admin' })
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin-pg@test.com', password: 'password123' })
    adminToken = login.body.token

    const ws = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Pagination WS' })
    workspaceId = ws.body.workspace.id

    const rows = Array.from({ length: 5 }, (_, i) => ({
      workspace_id: workspaceId,
      title: `Task ${i + 1}`,
      difficulty: 'medium',
      xp_reward: 40,
      status: 'to_do',
    }))
    await db('tasks').insert(rows)
  })

  afterAll(async () => {
    await db.destroy()
  })

  test('returns all tasks and no count header when unpaginated (backward compatible)', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.tasks).toHaveLength(5)
    expect(res.headers['x-total-count']).toBeUndefined()
  })

  test('bounds results and advertises total via X-Total-Count', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/tasks?limit=2&offset=0`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.tasks).toHaveLength(2)
    expect(res.headers['x-total-count']).toBe('5')
  })

  test('offset pages through the result set', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/tasks?limit=2&offset=4`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.tasks).toHaveLength(1)
    expect(res.headers['x-total-count']).toBe('5')
  })
})
