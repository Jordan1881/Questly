import { create } from 'zustand'
import { apiFetch } from '../lib/api'
import { useAuthStore } from './authStore'

function syncMembershipsFromPayload(payload) {
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'memberships')) {
    useAuthStore.getState().applyMembershipPayload(payload)
  }
}

export const useWorkspaceStore = create((set) => ({
  workspace: null,
  joinRequest: null,
  members: [],
  pendingJoinRequests: [],
  pendingXpApprovals: [],
  lastJiraSyncAt: null,
  lastJiraSyncResult: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchMemberships: async () => {
    const payload = await apiFetch('/api/workspaces/memberships')
    syncMembershipsFromPayload(payload)
    return payload.memberships || []
  },

  fetchMine: async () => {
    set({ isLoading: true, error: null })
    try {
      const payload = await apiFetch('/api/workspaces/mine')
      syncMembershipsFromPayload(payload)
      set({ workspace: payload.workspace, isLoading: false })
      return payload.workspace
    } catch (err) {
      set({ workspace: null, isLoading: false, error: err.message })
      throw err
    }
  },

  createWorkspace: async (name) => {
    set({ isLoading: true, error: null })
    try {
      const payload = await apiFetch('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      syncMembershipsFromPayload(payload)
      if (payload.workspace?.id) {
        useAuthStore.getState().setActiveWorkspace(payload.workspace.id)
      }
      set({ workspace: payload.workspace, isLoading: false })
      return payload.workspace
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
      // Admin (or other non-developer) callers get 403 — not a user-facing failure.
      if (err.status === 403 || err.status === 401) {
        set({ joinRequest: null, isLoading: false })
        return null
      }
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

  updateWorkspaceSettings: async (workspaceId, patch) => {
    set({ isLoading: true, error: null })
    try {
      const { workspace } = await apiFetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      set({ workspace, isLoading: false })
      return workspace
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  fetchPendingXpApprovals: async (workspaceId) => {
    set({ isLoading: true, error: null })
    try {
      const { xp_approval_requests } = await apiFetch(`/api/workspaces/${workspaceId}/xp-approvals`)
      set({ pendingXpApprovals: xp_approval_requests, isLoading: false })
      return xp_approval_requests
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  reviewXpApproval: async (workspaceId, requestId, status) => {
    const { xp_approval_request } = await apiFetch(
      `/api/workspaces/${workspaceId}/xp-approvals/${requestId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    )
    set((state) => ({
      pendingXpApprovals: state.pendingXpApprovals.filter((r) => r.id !== requestId),
    }))
    return xp_approval_request
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

  syncJiraTasks: async (workspaceId) => {
    set({ isLoading: true, error: null })
    try {
      const result = await apiFetch(`/api/tasks/sync/${workspaceId}`, { method: 'POST' })
      set({
        lastJiraSyncAt: new Date().toISOString(),
        lastJiraSyncResult: result,
        isLoading: false,
      })
      return result
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  connectJira: async (workspaceId, credentials) => {
    set({ isLoading: true, error: null })
    try {
      const { workspace } = await apiFetch(`/api/workspaces/${workspaceId}/jira/connect`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      set({ workspace, isLoading: false })
      return workspace
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  fetchWorkspaceJiraOAuthStatus: async () => {
    try {
      return await apiFetch('/api/workspaces/jira/oauth/status')
    } catch {
      return { available: false }
    }
  },


  fetchPendingJiraOAuth: async (workspaceId) => {
    try {
      return await apiFetch(`/api/workspaces/${workspaceId}/jira/oauth/pending`)
    } catch (err) {
      if (err.status === 404 || err.status === 410) return null
      throw err
    }
  },

  fetchPendingJiraOAuthSites: async (workspaceId) => {
    return apiFetch(`/api/workspaces/${workspaceId}/jira/oauth/pending/sites`)
  },

  confirmPendingJiraOAuthSite: async (workspaceId, siteUrl) => {
    return apiFetch(`/api/workspaces/${workspaceId}/jira/oauth/pending/site`, {
      method: 'POST',
      body: JSON.stringify({ site_url: siteUrl }),
    })
  },

  fetchPendingJiraOAuthProjects: async (workspaceId) => {
    return apiFetch(`/api/workspaces/${workspaceId}/jira/oauth/pending/projects`)
  },

  confirmPendingJiraOAuthProject: async (workspaceId, projectKey) => {
    set({ isLoading: true, error: null })
    try {
      const result = await apiFetch(`/api/workspaces/${workspaceId}/jira/oauth/pending/project`, {
        method: 'POST',
        body: JSON.stringify({ project_key: projectKey }),
      })
      const patch = {
        workspace: result.workspace,
        isLoading: false,
      }
      if (result.sync) {
        patch.lastJiraSyncAt = new Date().toISOString()
        patch.lastJiraSyncResult = result.sync
      }
      set(patch)
      return result
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  cancelPendingJiraOAuth: async (workspaceId) => {
    await apiFetch(`/api/workspaces/${workspaceId}/jira/oauth/pending`, { method: 'DELETE' })
    return { ok: true }
  },

  startWorkspaceJiraOAuth: async (
    workspaceId,
    { jira_site_url, jira_project_key, return_to = '/admin?tab=jira', mode } = {},
  ) => {
    const params = new URLSearchParams({ return_to })
    if (jira_site_url) params.set('jira_site_url', jira_site_url)
    if (jira_project_key) params.set('jira_project_key', jira_project_key)
    if (mode) params.set('mode', mode)
    const { authorize_url } = await apiFetch(
      `/api/workspaces/${workspaceId}/jira/oauth/start?${params.toString()}`,
    )
    window.location.assign(authorize_url)
    return { ok: true }
  },

  disconnectJira: async (workspaceId) => {
    set({ isLoading: true, error: null })
    try {
      const { workspace } = await apiFetch(`/api/workspaces/${workspaceId}/jira/disconnect`, {
        method: 'DELETE',
      })
      set({ workspace, isLoading: false })
      return workspace
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },
}))
