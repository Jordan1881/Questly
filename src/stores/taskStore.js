import { create } from 'zustand'
import { apiFetch } from '../lib/api'
import { useXpStore } from './xpStore'
import { useAuthStore } from './authStore'
import { useToastStore } from './toastStore'
import { useLevelUpStore } from './levelUpStore'
import { isLevelUpNotificationsEnabled } from '../lib/userPreferences'

function levelFromLifetime(lifetimeXp) {
  return Math.floor(Math.max(0, lifetimeXp ?? 0) / 1000) + 1
}

export const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

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

  toggleTaskCompletion: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return

    const completed = !task.done
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              done: completed,
              xpPending: completed ? t.xpPending : false,
              xpPendingAmount: completed ? t.xpPendingAmount : null,
            }
          : t,
      ),
    }))

    const prevLifetime = useAuthStore.getState().user?.lifetime_xp ?? 0

    try {
      const { task: updated, user, reward } = await apiFetch(`/api/tasks/${id}/completion`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      })
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
      }))
      if (user) {
        useXpStore.getState().syncFromUser(user)
        const currentUser = useAuthStore.getState().user
        useAuthStore.setState({ user: { ...currentUser, ...user } })

        if (completed && reward?.pending) {
          useToastStore.getState().showSuccess(`+${reward.pendingXp} XP pending approval`)
        } else if (reward?.pendingCancelled) {
          useToastStore.getState().showSuccess('XP approval request cancelled')
        } else if (completed && reward?.xpDelta > 0) {
          useToastStore.getState().showSuccess(`+${reward.xpDelta} XP`)
          const newLevel = levelFromLifetime(user.lifetime_xp ?? prevLifetime)
          const oldLevel = levelFromLifetime(prevLifetime)
          if (newLevel > oldLevel && isLevelUpNotificationsEnabled(user)) {
            useLevelUpStore.getState().show(newLevel)
          }
        }
      }
      return { task: updated, user, reward }
    } catch (err) {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? task : t)),
        error: err.message,
      }))
      throw err
    }
  },
}))
