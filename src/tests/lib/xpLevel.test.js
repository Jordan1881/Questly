import { describe, expect, it } from 'vitest'
import { xpLevelInfo } from '../../lib/xpLevel'

describe('xpLevelInfo', () => {
  it('computes level 1 at 0 XP', () => {
    expect(xpLevelInfo(0)).toMatchObject({
      level: 1,
      xpInLevel: 0,
      percent: 0,
      xpToNext: 1000,
    })
  })

  it('computes level 2 at 1000 XP', () => {
    expect(xpLevelInfo(1000)).toMatchObject({
      level: 2,
      xpInLevel: 0,
      nextLevel: 3,
    })
  })

  it('computes progress within a level', () => {
    expect(xpLevelInfo(650)).toMatchObject({
      level: 1,
      xpInLevel: 650,
      percent: 65,
      xpToNext: 350,
    })
  })
})
