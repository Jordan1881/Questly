import { create } from 'zustand'
import { apiFetch } from '../lib/api'

export const useSprintStore = create((set) => ({
  activeSprint: null,
  sprints: [],
  isLoading: false,
  error: null,

  setSprint: (sprint) => set({ activeSprint: sprint }),
  closeSprint: () => set({ activeSprint: null }),

  fetchActiveSprint: async (workspaceId) => {
    if (!workspaceId) {
      set({ activeSprint: null })
      return null
    }
    set({ isLoading: true, error: null })
    try {
      const { sprint } = await apiFetch(`/api/workspaces/${workspaceId}/sprints/active`)
      set({ activeSprint: sprint, isLoading: false })
      return sprint
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  fetchSprints: async (workspaceId) => {
    if (!workspaceId) {
      set({ sprints: [] })
      return []
    }
    set({ isLoading: true, error: null })
    try {
      const { sprints } = await apiFetch(`/api/workspaces/${workspaceId}/sprints`)
      set({ sprints, isLoading: false })
      return sprints
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  createSprint: async (workspaceId, payload) => {
    set({ isLoading: true, error: null })
    try {
      const { sprint } = await apiFetch(`/api/workspaces/${workspaceId}/sprints`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      set({ activeSprint: sprint, isLoading: false })
      return sprint
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  closeSprintById: async (sprintId, workspaceId) => {
    set({ isLoading: true, error: null })
    try {
      await apiFetch(`/api/sprints/${sprintId}/close`, { method: 'POST' })
      set({ activeSprint: null, isLoading: false })
      if (workspaceId) {
        await useSprintStore.getState().fetchSprints(workspaceId)
      }
      return true
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },
}))
