import { create } from 'zustand'
import { apiFetch, apiUpload } from '../lib/api'
import { useAuthStore } from './authStore'
import { useToastStore } from './toastStore'
import { parsePreferences } from '../lib/userPreferences'

function syncAuthFromProfile(profile) {
  if (!profile) return
  useAuthStore.setState((s) => ({
    user: s.user
      ? {
          ...s.user,
          username: profile.username,
          email: profile.email,
          avatar_url: profile.avatarUrl,
          age: profile.age ?? null,
          preferences: parsePreferences(profile.preferences),
        }
      : s.user,
  }))
}

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
      syncAuthFromProfile(data.profile)
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
    syncAuthFromProfile(profile)
    return profile
  },

  updatePreferences: async (preferences) => {
    const { profile } = await apiFetch('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ preferences }),
    })
    set({ profile })
    syncAuthFromProfile(profile)
    return profile
  },

  uploadAvatar: async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const { profile } = await apiUpload('/api/users/me/avatar', formData)
    set({ profile })
    syncAuthFromProfile(profile)
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
