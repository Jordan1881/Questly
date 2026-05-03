import { describe, it, expect, beforeEach } from 'vitest'
import { useXpStore } from '../../stores/xpStore'

const defaultState = { userXP: 1250, userCoins: 125 }

describe('xpStore', () => {
  beforeEach(() => {
    useXpStore.setState(defaultState)
  })

  it('initialises with correct default XP and coins', () => {
    const { userXP, userCoins } = useXpStore.getState()
    expect(userXP).toBe(1250)
    expect(userCoins).toBe(125)
  })

  it('addXP, spendCoins, setUserXP, setUserCoins all update state correctly', () => {
    useXpStore.getState().addXP(200)
    useXpStore.getState().spendCoins(25)
    expect(useXpStore.getState().userXP).toBe(1450)
    expect(useXpStore.getState().userCoins).toBe(100)
    useXpStore.getState().setUserXP(500)
    useXpStore.getState().setUserCoins(50)
    expect(useXpStore.getState().userXP).toBe(500)
    expect(useXpStore.getState().userCoins).toBe(50)
  })
})
