import { useCallback } from 'react'
import { useXpStore } from '../stores/xpStore'
import { useAuthStore } from '../stores/authStore'

export function useXP() {
  const sprintXP = useXpStore((s) => s.userXP)
  const coins = useXpStore((s) => s.userCoins)
  const lifetimeXP = useAuthStore((s) => s.user?.lifetime_xp ?? 0)
  const syncFromUser = useXpStore((s) => s.syncFromUser)
  const addXP = useXpStore((s) => s.addXP)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  const refresh = useCallback(async () => {
    const user = await fetchMe()
    if (user) syncFromUser(user)
    return user
  }, [fetchMe, syncFromUser])

  return {
    sprintXP,
    coins,
    lifetimeXP,
    addXP,
    syncFromUser,
    refresh,
  }
}
