import { create } from 'zustand'
import { apiFetch } from '../lib/api'

export const useWorkspaceStore = create((set) => ({
  workspace: null,
  joinRequest: null,
  members: [],
  pendingJoinRequests: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchMine: async () => {
    set({ isLoading: true, error: null })
    try {
      const { workspace } = await apiFetch('/api/workspaces/mine')
      set({ workspace, isLoading: false })
      return workspace
    } catch (err) {
      set({ workspace: null, isLoading: false, error: err.message })
      throw err
    }
  },

  createWorkspace: async (name) => {
    set({ isLoading: true, error: null })
    try {
      const { workspace } = await apiFetch('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      set({ workspace, isLoading: false })
      return workspace
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  lookupByCode: async (code) => {
    set({ isLoading: true, error: null })
    try {
      const { workspace } = await apiFetch(`/api/workspaces/by-code/${encodeURIComponent(code.trim().toUpperCase())}`)
      set({ isLoading: false })
      return workspace
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  submitJoinRequest: async (workspaceId) => {
    set({ isLoading: true, error: null })
    try {
      const { join_request } = await apiFetch(`/api/workspaces/${workspaceId}/join-requests`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      set({ joinRequest: join_request, isLoading: false })
      return join_request
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  fetchMyJoinRequest: async () => {
    set({ isLoading: true, error: null })
    try {
      const { join_request } = await apiFetch('/api/join-requests/me')
      set({ joinRequest: join_request, isLoading: false })
      return join_request
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  fetchPendingJoinRequests: async (workspaceId) => {
    set({ isLoading: true, error: null })
    try {
      const { join_requests } = await apiFetch(`/api/workspaces/${workspaceId}/join-requests`)
      set({ pendingJoinRequests: join_requests, isLoading: false })
      return join_requests
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  reviewJoinRequest: async (workspaceId, requestId, status) => {
    const { join_request } = await apiFetch(
      `/api/workspaces/${workspaceId}/join-requests/${requestId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    )
    set((state) => ({
      pendingJoinRequests: state.pendingJoinRequests.filter((r) => r.id !== requestId),
    }))
    return join_request
  },

  fetchMembers: async (workspaceId) => {
    const { members } = await apiFetch(`/api/workspaces/${workspaceId}/members`)
    set({ members })
    return members
  },
}))
