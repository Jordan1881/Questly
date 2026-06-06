import { create } from 'zustand'
import { apiFetch } from '../lib/api'
import { useXpStore } from './xpStore'
import { useAuthStore } from './authStore'

export const useRewardStore = create((set, get) => ({
  rewards: [],
  isLoading: false,
  isPurchasing: false,
  error: null,

  fetchRewards: async (workspaceId) => {
    set({ isLoading: true, error: null })
    try {
      const { rewards } = await apiFetch(`/api/workspaces/${workspaceId}/rewards`)
      set({ rewards, isLoading: false })
      return rewards
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  createReward: async (workspaceId, payload) => {
    const { reward } = await apiFetch(`/api/workspaces/${workspaceId}/rewards`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    set((s) => ({ rewards: [reward, ...s.rewards] }))
    return reward
  },

  updateReward: async (rewardId, payload) => {
    const { reward } = await apiFetch(`/api/rewards/${rewardId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    set((s) => ({
      rewards: s.rewards.map((r) => (r.id === rewardId ? { ...r, ...reward } : r)),
    }))
    return reward
  },

  deleteReward: async (rewardId) => {
    await apiFetch(`/api/rewards/${rewardId}`, { method: 'DELETE' })
    set((s) => ({ rewards: s.rewards.filter((r) => r.id !== rewardId) }))
  },

  uploadCoupons: async (rewardId, couponCodes) => {
    const result = await apiFetch(`/api/rewards/${rewardId}/coupons`, {
      method: 'POST',
      body: JSON.stringify({ couponCodes }),
    })
    set((s) => ({
      rewards: s.rewards.map((r) => (r.id === rewardId ? { ...r, ...result.reward } : r)),
    }))
    return result
  },

  purchaseReward: async (rewardId) => {
    set({ isPurchasing: true })
    try {
      const result = await apiFetch(`/api/rewards/${rewardId}/purchase`, { method: 'POST' })
      const balances = result.balances
      useXpStore.getState().syncFromUser({
        ...useAuthStore.getState().user,
        current_sprint_xp: balances.current_sprint_xp,
        lifetime_xp: balances.lifetime_xp,
        coin_balance: balances.coin_balance,
      })
      useAuthStore.setState((s) => ({
        user: s.user
          ? {
              ...s.user,
              current_sprint_xp: balances.current_sprint_xp,
              lifetime_xp: balances.lifetime_xp,
              coin_balance: balances.coin_balance,
            }
          : s.user,
      }))
      const { rewards } = get()
      if (rewards.length) {
        const workspaceId = rewards[0]?.workspaceId
        if (workspaceId) await get().fetchRewards(workspaceId)
      }
      set({ isPurchasing: false })
      return result
    } catch (err) {
      set({ isPurchasing: false })
      throw err
    }
  },
}))
