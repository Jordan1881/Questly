const { assertE2eEnabled } = require('../controllers/e2eSeed')

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
  return res
}

describe('assertE2eEnabled', () => {
  const saved = {
    NODE_ENV: process.env.NODE_ENV,
    E2E_SEED_ENABLED: process.env.E2E_SEED_ENABLED,
  }

  afterEach(() => {
    process.env.NODE_ENV = saved.NODE_ENV
    if (saved.E2E_SEED_ENABLED === undefined) delete process.env.E2E_SEED_ENABLED
    else process.env.E2E_SEED_ENABLED = saved.E2E_SEED_ENABLED
  })

  test('returns 404 when flag is off', () => {
    process.env.NODE_ENV = 'development'
    delete process.env.E2E_SEED_ENABLED
    const res = mockRes()
    const next = jest.fn()
    assertE2eEnabled({}, res, next)
    expect(res.statusCode).toBe(404)
    expect(next).not.toHaveBeenCalled()
  })

  test('returns 404 in production even when flag is on', () => {
    process.env.NODE_ENV = 'production'
    process.env.E2E_SEED_ENABLED = 'true'
    const res = mockRes()
    const next = jest.fn()
    assertE2eEnabled({}, res, next)
    expect(res.statusCode).toBe(404)
    expect(next).not.toHaveBeenCalled()
  })

  test('allows next when non-production and flag is on', () => {
    process.env.NODE_ENV = 'development'
    process.env.E2E_SEED_ENABLED = 'true'
    const res = mockRes()
    const next = jest.fn()
    assertE2eEnabled({}, res, next)
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.statusCode).toBeNull()
  })
})
