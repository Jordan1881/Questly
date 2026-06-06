import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useXP } from '../../hooks/useXP'
import { useXpStore } from '../../stores/xpStore'
import { useAuthStore } from '../../stores/authStore'

describe('useXP', () => {
  beforeEach(() => {
    useXpStore.setState({ userXP: 0, userCoins: 0 })
    useAuthStore.setState({
      user: { lifetime_xp: 0, current_sprint_xp: 0, coin_balance: 0 },
      token: 'test-token',
    })
  })

  it('returns XP values from stores', () => {
    useXpStore.setState({ userXP: 120, userCoins: 12 })
    useAuthStore.setState({
      user: { lifetime_xp: 500, current_sprint_xp: 120, coin_balance: 12 },
    })

    const { result } = renderHook(() => useXP())

    expect(result.current.sprintXP).toBe(120)
    expect(result.current.coins).toBe(12)
    expect(result.current.lifetimeXP).toBe(500)
  })

  it('refresh syncs user from fetchMe', async () => {
    const fetchMe = vi.fn().mockResolvedValue({
      current_sprint_xp: 40,
      coin_balance: 4,
      lifetime_xp: 40,
    })
    useAuthStore.setState({ fetchMe })

    const { result } = renderHook(() => useXP())

    await act(async () => {
      await result.current.refresh()
    })

    expect(fetchMe).toHaveBeenCalled()
    expect(useXpStore.getState().userXP).toBe(40)
    expect(useXpStore.getState().userCoins).toBe(4)
  })
})
