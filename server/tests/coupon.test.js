const { isExpired } = require('../services/coupon')

describe('isExpired', () => {
  test('returns false for null and undefined', () => {
    expect(isExpired(null)).toBe(false)
    expect(isExpired(undefined)).toBe(false)
  })

  test('returns true for past dates', () => {
    expect(isExpired('2020-01-01T12:00:00.000Z')).toBe(true)
  })

  test('returns false for future dates', () => {
    const future = new Date()
    future.setUTCFullYear(future.getUTCFullYear() + 1)
    expect(isExpired(future.toISOString())).toBe(false)
  })

  test('returns false for today (UTC date-only)', () => {
    const today = new Date()
    today.setUTCHours(15, 0, 0, 0)
    expect(isExpired(today.toISOString())).toBe(false)
  })
})
