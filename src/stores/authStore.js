import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useXpStore } from './xpStore'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function authFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `Request failed: ${res.status}`)
  return body
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

      setUserRole: (role) => set({ userRole: role }),
      setLoggedIn: (val) => set({ isLoggedIn: val }),
      clearError: () => set({ error: null }),

      fetchMe: async () => {
        const { token } = get()
        if (!token) return null
        try {
          const { user } = await authFetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
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
          const { user, token } = await authFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
          })
          set({ user, token, userRole: user.role, isLoggedIn: true, isLoading: false, error: null })
          useXpStore.getState().syncFromUser(user)
          return { ok: true }
        } catch (err) {
          set({ isLoading: false, error: err.message })
          return { ok: false, error: err.message }
        }
      },

      register: async (formData) => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await authFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(formData),
          })
          set({ user, token, userRole: user.role, isLoggedIn: true, isLoading: false, error: null })
          useXpStore.getState().syncFromUser(user)
          return { ok: true }
        } catch (err) {
          set({ isLoading: false, error: err.message })
          return { ok: false, error: err.message }
        }
      },

      logout: async () => {
        const { token } = get()
        if (token) {
          authFetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {})
        }
        set({ user: null, token: null, userRole: 'developer', isLoggedIn: false, isLoading: false, error: null })
        useXpStore.getState().syncFromUser(null)
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
