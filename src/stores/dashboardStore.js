import { create } from 'zustand'
import { apiFetch } from '../lib/api'
import { useXpStore } from './xpStore'
import { useAuthStore } from './authStore'
import { useSprintStore } from './sprintStore'

function syncDashboardToStores(data) {
  useXpStore.getState().syncFromUser({
    current_sprint_xp: data.xp.current_sprint_xp,
    lifetime_xp: data.xp.lifetime_xp,
    coin_balance: data.xp.coin_balance,
  })
  useAuthStore.setState((s) => ({
    user: s.user
      ? {
          ...s.user,
          streak_days: data.streak,
          current_sprint_xp: data.xp.current_sprint_xp,
          lifetime_xp: data.xp.lifetime_xp,
          coin_balance: data.xp.coin_balance,
        }
      : s.user,
  }))
  useSprintStore.setState({ activeSprint: data.activeSprint })
}

export const useDashboardStore = create((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiFetch('/api/users/me/dashboard')
      syncDashboardToStores(data)
      set({ data, isLoading: false })
      return data
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  clear: () => set({ data: null, isLoading: false, error: null }),
}))
