import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiFetch, ApiError } from '../lib/api'
import { useXpStore } from './xpStore'
import { getShellRole, roleHomePath } from '../lib/workspaceNav'

function authErrorMessage(err) {
  return err instanceof ApiError || err instanceof Error ? err.message : 'Request failed'
}

function membershipPatch(payload) {
  if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'memberships')) {
    return {
      memberships: undefined,
      activeWorkspaceId: null,
      activeMembership: null,
    }
  }

  const memberships = payload.memberships || []
  const activeWorkspaceId = payload.active_workspace_id ?? null
  const activeMembership =
    payload.active_membership ||
    memberships.find((m) => m.workspace_id === activeWorkspaceId) ||
    null

  const shellRole = getShellRole({
    memberships,
    activeMembership,
    userRole: payload.user?.role || 'developer',
  })

  return {
    memberships,
    activeWorkspaceId,
    activeMembership,
    userRole: shellRole,
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      userRole: 'developer',
      memberships: undefined,
      activeWorkspaceId: null,
      activeMembership: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,
      sessionExpired: false,

      setUserRole: (role) => set({ userRole: role }),
      setLoggedIn: (val) => set({ isLoggedIn: val }),
      clearError: () => set({ error: null }),
      clearSessionExpired: () => set({ sessionExpired: false }),

      applyMembershipPayload: (payload) => {
        const patch = membershipPatch(payload)
        set(patch)
        return patch
      },

      setActiveWorkspace: (workspaceId) => {
        const { memberships } = get()
        if (!Array.isArray(memberships)) return null
        const membership = memberships.find((m) => m.workspace_id === workspaceId) || null
        if (!membership) return null
        const shellRole = membership.role === 'admin' ? 'admin' : 'developer'
        set({
          activeWorkspaceId: workspaceId,
          activeMembership: membership,
          userRole: shellRole,
          user: get().user
            ? { ...get().user, workspace_id: workspaceId }
            : get().user,
        })
        return roleHomePath(shellRole, workspaceId)
      },

      fetchMe: async () => {
        const { token, activeWorkspaceId: preferredId } = get()
        if (!token) return null
        try {
          const payload = await apiFetch('/api/auth/me')
          const { user } = payload
          const patch = membershipPatch(payload)

          // Defense: if server ignored X-Workspace-Id, keep the client's active preference.
          if (
            Array.isArray(patch.memberships) &&
            preferredId &&
            patch.activeWorkspaceId !== preferredId
          ) {
            const kept = patch.memberships.find((m) => m.workspace_id === preferredId)
            if (kept) {
              patch.activeWorkspaceId = preferredId
              patch.activeMembership = kept
              patch.userRole = kept.role === 'admin' ? 'admin' : 'developer'
            }
          }

          const nextUser = {
            ...user,
            workspace_id: patch.activeWorkspaceId ?? user.workspace_id,
          }
          set({ user: nextUser, ...patch })
          useXpStore.getState().syncFromUser(nextUser)
          return nextUser
        } catch {
          return null
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const payload = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
            skipSessionExpiry: true,
          })
          const { user, token } = payload
          const patch = membershipPatch(payload)
          set({
            user,
            token,
            isLoggedIn: true,
            isLoading: false,
            error: null,
            ...patch,
            userRole: patch.userRole || user.role,
          })
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
          const payload = await apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(formData),
            skipSessionExpiry: true,
          })
          const { user, token } = payload
          const patch = membershipPatch(payload)
          set({
            user,
            token,
            isLoggedIn: true,
            isLoading: false,
            error: null,
            ...patch,
            userRole: patch.userRole || user.role,
          })
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
          memberships: undefined,
          activeWorkspaceId: null,
          activeMembership: null,
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

      changePassword: async ({ currentPassword, newPassword }) => {
        set({ isLoading: true, error: null })
        try {
          await apiFetch('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
          })
          set({ isLoading: false })
          return { ok: true }
        } catch (err) {
          set({ isLoading: false, error: authErrorMessage(err) })
          throw err
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
        memberships: state.memberships,
        activeWorkspaceId: state.activeWorkspaceId,
        activeMembership: state.activeMembership,
      }),
    }
  )
)
