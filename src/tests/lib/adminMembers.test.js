import { describe, it, expect } from 'vitest'
import { mapMemberToDeveloper, summarizeTeam } from '../../lib/adminMembers'

describe('adminMembers', () => {
  it('maps API member fields to developer card shape', () => {
    const dev = mapMemberToDeveloper({
      id: 'u1',
      username: 'Alex',
      current_sprint_xp: 120,
      lifetime_xp: 1500,
      coin_balance: 12,
    }, 2)

    expect(dev).toMatchObject({
      id: 'u1',
      name: 'Alex',
      level: 2,
      xp: 120,
      coins: 12,
      avatarIdx: 2,
    })
  })

  it('summarizes team counts', () => {
    expect(summarizeTeam([{ status: 'active' }, { status: 'inactive' }], 3)).toEqual({
      total: 2,
      active: 1,
      inactive: 1,
      pending: 3,
    })
  })
})
