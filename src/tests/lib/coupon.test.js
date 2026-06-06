import { describe, it, expect } from 'vitest'
import { isExpiringSoon, maskCouponCode } from '../../lib/coupon'

describe('coupon helpers', () => {
  it('maskCouponCode masks all but last 4 characters', () => {
    expect(maskCouponCode('SAVE-ME-1234')).toBe('****-1234')
  })

  it('isExpiringSoon returns true within 30 days', () => {
    const in29Days = new Date()
    in29Days.setUTCDate(in29Days.getUTCDate() + 29)
    expect(isExpiringSoon(in29Days.toISOString())).toBe(true)
  })

  it('isExpiringSoon returns false beyond 30 days', () => {
    const in31Days = new Date()
    in31Days.setUTCDate(in31Days.getUTCDate() + 31)
    expect(isExpiringSoon(in31Days.toISOString())).toBe(false)
  })

  it('isExpiringSoon returns false for past dates', () => {
    expect(isExpiringSoon('2020-01-01T00:00:00.000Z')).toBe(false)
  })
})
