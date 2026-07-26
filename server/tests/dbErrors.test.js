const { isTransientDbError, withDbRetry } = require('../lib/dbErrors')

describe('dbErrors', () => {
  test('detects common pg / network connection failures', () => {
    expect(isTransientDbError({ code: 'ECONNRESET' })).toBe(true)
    expect(isTransientDbError({ message: 'Connection terminated unexpectedly' })).toBe(true)
    expect(isTransientDbError({ message: 'Invalid credentials' })).toBe(false)
  })

  test('withDbRetry retries once on transient errors then succeeds', async () => {
    let calls = 0
    const result = await withDbRetry(async () => {
      calls += 1
      if (calls === 1) {
        const err = new Error('Connection terminated unexpectedly')
        err.code = 'ECONNRESET'
        throw err
      }
      return 'ok'
    })

    expect(result).toBe('ok')
    expect(calls).toBe(2)
  })

  test('withDbRetry does not retry non-transient errors', async () => {
    let calls = 0
    await expect(
      withDbRetry(async () => {
        calls += 1
        throw new Error('Invalid credentials')
      }),
    ).rejects.toThrow('Invalid credentials')
    expect(calls).toBe(1)
  })
})
