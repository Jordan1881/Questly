import { create } from 'zustand'
import { apiFetch } from '../lib/api'
import { useAuthStore } from './authStore'
import { useToastStore } from './toastStore'

export const useProfileStore = create((set, get) => ({
  profile: null,
  purchases: [],
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiFetch('/api/users/me')
      set({
        profile: data.profile,
        purchases: data.purchases ?? [],
        isLoading: false,
      })
      return data
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  updateProfile: async (patch) => {
    const { profile } = await apiFetch('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    set({ profile })
    useAuthStore.setState((s) => ({
      user: s.user ? { ...s.user, username: profile.username, avatar_url: profile.avatarUrl } : s.user,
    }))
    return profile
  },

  deletePurchase: async (purchaseId) => {
    const previous = get().purchases
    set({ purchases: previous.filter((p) => p.id !== purchaseId) })
    try {
      await apiFetch(`/api/users/me/purchases/${purchaseId}`, { method: 'DELETE' })
      useToastStore.getState().showSuccess('Removed from My Rewards')
    } catch (err) {
      set({ purchases: previous, error: err.message })
      throw err
    }
  },
}))
