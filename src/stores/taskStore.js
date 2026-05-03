import { create } from 'zustand'
// import { apiFetch } from '../lib/api'   ← uncomment in T022/M4 when backend is live

// Scaffold — will be populated from the Jira sync API (M4).
// All fetch calls should use apiFetch() — it attaches the Bearer token automatically.
export const useTaskStore = create((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  updateTask: (id, patch) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  // TODO M4: fetch tasks from backend
  // fetchTasks: async () => {
  //   const tasks = await apiFetch('/api/tasks')
  //   set({ tasks })
  // },
}))
