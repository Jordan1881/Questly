import { describe, it, expect, beforeEach } from 'vitest'
import { useXpStore } from '../../stores/xpStore'

const defaultState = { userXP: 0, userCoins: 0 }

describe('xpStore', () => {
  beforeEach(() => {
    useXpStore.setState(defaultState)
  })

  it('initialises with zero XP and coins', () => {
    const { userXP, userCoins } = useXpStore.getState()
    expect(userXP).toBe(0)
    expect(userCoins).toBe(0)
  })

  it('syncFromUser maps backend balances into store state', () => {
    useXpStore.getState().syncFromUser({
      current_sprint_xp: 120,
      coin_balance: 12,
    })

    expect(useXpStore.getState().userXP).toBe(120)
    expect(useXpStore.getState().userCoins).toBe(12)
  })

  it('addXP, spendCoins, setUserXP, setUserCoins all update state correctly', () => {
    useXpStore.getState().addXP(200)
    useXpStore.getState().spendCoins(25)
    expect(useXpStore.getState().userXP).toBe(200)
    expect(useXpStore.getState().userCoins).toBe(0)
    useXpStore.getState().setUserXP(500)
    useXpStore.getState().setUserCoins(50)
    expect(useXpStore.getState().userXP).toBe(500)
    expect(useXpStore.getState().userCoins).toBe(50)
  })
})
