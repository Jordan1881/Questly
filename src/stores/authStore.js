import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// isLoggedIn is false by default — ProtectedRoute uses this to guard all protected pages.
// Set to true only inside JiraAuth.onConnect after the user completes the auth flow.
// userRole is persisted to localStorage via the persist middleware.
export const useAuthStore = create(
  persist(
    (set) => ({
      userRole: 'developer',
      isLoggedIn: false,
      setUserRole: (role) => set({ userRole: role }),
      setLoggedIn: (val) => set({ isLoggedIn: val }),
    }),
    {
      name: 'questly-auth',
      partialize: (state) => ({
        userRole: state.userRole,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)
