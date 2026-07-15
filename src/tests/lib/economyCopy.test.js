import { describe, it, expect } from 'vitest'
import { ECONOMY, streakMilestoneCopy, streakPercent } from '../../lib/economyCopy'

describe('economyCopy', () => {
  it('keeps the three-way economy sentence', () => {
    expect(ECONOMY.economySentence).toMatch(/Lifetime XP/i)
    expect(ECONOMY.economySentence).toMatch(/Season score/i)
    expect(ECONOMY.economySentence).toMatch(/Coins/i)
  })

  it('maps streak milestones for purpose copy', () => {
    expect(streakMilestoneCopy(0)).toMatch(/start your streak/i)
    expect(streakMilestoneCopy(1)).toMatch(/3-day streak/i)
    expect(streakMilestoneCopy(3)).toMatch(/7-day streak/i)
    expect(streakMilestoneCopy(7)).toMatch(/7-day streak unlocked/i)
  })

  it('caps streak percent at 7-day goal', () => {
    expect(streakPercent(0)).toBe(0)
    expect(streakPercent(7)).toBe(100)
    expect(streakPercent(14)).toBe(100)
  })
})
