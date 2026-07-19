const { validateBody } = require('../middleware/validate')
const {
  loginSchema,
  taskCompletionSchema,
  sprintCreateSchema,
} = require('../validation/schemas')

function runMiddleware(middleware, body) {
  return new Promise((resolve) => {
    const req = { body }
    const res = {
      statusCode: null,
      payload: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        this.payload = payload
        resolve({ req, res: this, nextCalled: false })
        return this
      },
    }
    const next = () => resolve({ req, res, nextCalled: true })
    middleware(req, res, next)
  })
}

describe('validateBody middleware', () => {
  test('calls next and coerces body on valid input', async () => {
    const { nextCalled, req } = await runMiddleware(
      validateBody(taskCompletionSchema),
      { completed: true },
    )
    expect(nextCalled).toBe(true)
    expect(req.body).toEqual({ completed: true })
  })

  test('returns 400 with the historical message for invalid completion', async () => {
    const { nextCalled, res } = await runMiddleware(
      validateBody(taskCompletionSchema),
      { completed: 'yes' },
    )
    expect(nextCalled).toBe(false)
    expect(res.statusCode).toBe(400)
    expect(res.payload.error).toBe('completed must be a boolean')
  })

  test('login schema rejects missing fields with historical message', async () => {
    const { res } = await runMiddleware(validateBody(loginSchema), { email: 'a@b.com' })
    expect(res.statusCode).toBe(400)
    expect(res.payload.error).toBe('email and password are required')
  })

  test('login schema accepts valid credentials and passes unknown fields through', async () => {
    const { nextCalled, req } = await runMiddleware(validateBody(loginSchema), {
      email: 'a@b.com',
      password: 'secret',
      remember: true,
    })
    expect(nextCalled).toBe(true)
    expect(req.body.email).toBe('a@b.com')
  })

  test('sprint schema requires a non-empty name and trims it', async () => {
    const missing = await runMiddleware(validateBody(sprintCreateSchema), { name: '   ' })
    expect(missing.res.statusCode).toBe(400)
    expect(missing.res.payload.error).toBe('name is required')

    const ok = await runMiddleware(validateBody(sprintCreateSchema), {
      name: '  Sprint 1  ',
      startDate: null,
    })
    expect(ok.nextCalled).toBe(true)
    expect(ok.req.body.name).toBe('Sprint 1')
  })
})
