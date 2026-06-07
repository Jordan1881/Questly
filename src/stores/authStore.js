import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiFetch, ApiError } from '../lib/api'
import { useXpStore } from './xpStore'

function authErrorMessage(err) {
  return err instanceof ApiError || err instanceof Error ? err.message : 'Request failed'
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      userRole: 'developer',
      isLoggedIn: false,
      isLoading: false,
      error: null,
      sessionExpired: false,

      setUserRole: (role) => set({ userRole: role }),
      setLoggedIn: (val) => set({ isLoggedIn: val }),
      clearError: () => set({ error: null }),
      clearSessionExpired: () => set({ sessionExpired: false }),

      fetchMe: async () => {
        const { token } = get()
        if (!token) return null
        try {
          const { user } = await apiFetch('/api/auth/me')
          set({ user, userRole: user.role })
          useXpStore.getState().syncFromUser(user)
          return user
        } catch {
          return null
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
            skipSessionExpiry: true,
          })
          set({ user, token, userRole: user.role, isLoggedIn: true, isLoading: false, error: null })
          useXpStore.getState().syncFromUser(user)
          return { ok: true }
        } catch (err) {
          set({ isLoading: false, error: authErrorMessage(err) })
          return { ok: false, error: authErrorMessage(err) }
        }
      },

      register: async (formData) => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(formData),
            skipSessionExpiry: true,
          })
          set({ user, token, userRole: user.role, isLoggedIn: true, isLoading: false, error: null })
          useXpStore.getState().syncFromUser(user)
          return { ok: true }
        } catch (err) {
          set({ isLoading: false, error: authErrorMessage(err) })
          return { ok: false, error: authErrorMessage(err) }
        }
      },

      logout: async ({ sessionExpired = false } = {}) => {
        try {
          await apiFetch('/api/auth/logout', { method: 'POST' })
        } catch {
          // Best-effort server logout; local session is always cleared.
        }
        set({
          user: null,
          token: null,
          userRole: 'developer',
          isLoggedIn: false,
          isLoading: false,
          error: null,
          sessionExpired,
        })
        useXpStore.getState().syncFromUser(null)
      },

      startJiraOAuth: async (returnTo = '/dashboard') => {
        set({ isLoading: true, error: null })
        try {
          const params = new URLSearchParams({ return_to: returnTo })
          const body = await apiFetch(`/api/auth/jira/oauth/start?${params}`)
          window.location.assign(body.authorize_url)
          return { ok: true }
        } catch (err) {
          set({ isLoading: false, error: authErrorMessage(err) })
          return { ok: false, error: authErrorMessage(err) }
        }
      },

      fetchJiraOAuthStatus: async () => {
        const { token } = get()
        if (!token) return { available: false }
        try {
          return await apiFetch('/api/auth/jira/oauth/status')
        } catch {
          return { available: false }
        }
      },

      connectJira: async (accessToken) => {
        set({ isLoading: true, error: null })
        try {
          const { user } = await apiFetch('/api/auth/me/jira/connect', {
            method: 'POST',
            body: JSON.stringify({ access_token: accessToken }),
          })
          set({ user, isLoading: false })
          return { ok: true, user }
        } catch (err) {
          set({ isLoading: false, error: authErrorMessage(err) })
          return { ok: false, error: authErrorMessage(err) }
        }
      },

      disconnectJira: async () => {
        set({ isLoading: true, error: null })
        try {
          const { user } = await apiFetch('/api/auth/me/jira/disconnect', {
            method: 'DELETE',
          })
          set({ user, isLoading: false })
          return { ok: true, user }
        } catch (err) {
          set({ isLoading: false, error: authErrorMessage(err) })
          return { ok: false, error: authErrorMessage(err) }
        }
      },
    }),
    {
      name: 'questly-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        userRole: state.userRole,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)
