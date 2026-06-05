import { create } from 'zustand'
import { apiFetch } from '../lib/api'

export const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  lastSyncedAt: null,

  setTasks: (tasks) => set({ tasks }),
  updateTask: (id, patch) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  fetchTasks: async () => {
    set({ isLoading: true, error: null })
    try {
      const { tasks } = await apiFetch('/api/tasks')
      set({ tasks, isLoading: false })
      return tasks
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  syncWorkspaceTasks: async (workspaceId) => {
    set({ isLoading: true, error: null })
    try {
      const result = await apiFetch(`/api/tasks/sync/${workspaceId}`, { method: 'POST' })
      set({ lastSyncedAt: new Date().toISOString(), isLoading: false })
      return result
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  toggleTaskCompletion: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return

    const completed = !task.done
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: completed } : t)),
    }))

    try {
      const { task: updated } = await apiFetch(`/api/tasks/${id}/completion`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      })
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
      }))
    } catch (err) {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: task.done } : t)),
        error: err.message,
      }))
      throw err
    }
  },
}))
