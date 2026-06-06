import { describe, it, expect } from 'vitest'
import { buildWeeklyXpData, weeklyXpTotal } from '../../lib/xpHistoryChart'

describe('xpHistoryChart', () => {
  it('aggregates positive XP into weekly buckets', () => {
    const today = new Date()
    const data = buildWeeklyXpData([
      { amount: 40, createdAt: today.toISOString() },
      { amount: 20, createdAt: today.toISOString() },
      { amount: -10, createdAt: today.toISOString() },
    ])

    expect(data).toHaveLength(7)
    expect(weeklyXpTotal([
      { amount: 40, createdAt: today.toISOString() },
      { amount: 20, createdAt: today.toISOString() },
    ])).toBe(60)
  })
})
