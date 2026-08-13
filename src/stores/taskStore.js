import { create } from 'zustand'
import { apiFetch } from '../lib/api'
import { useXpStore } from './xpStore'
import { useAuthStore } from './authStore'
import { useToastStore } from './toastStore'
import { useLevelUpStore } from './levelUpStore'
import { isLevelUpNotificationsEnabled } from '../lib/userPreferences'
import { MOTION } from '../design-system/motion/config'

function levelFromLifetime(lifetimeXp) {
  return Math.floor(Math.max(0, lifetimeXp ?? 0) / 1000) + 1
}

function applyOptimisticToggle(set, id, completed) {
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
}

function syncUserFromCompletion(user) {
  useXpStore.getState().syncFromUser(user)
  const currentUser = useAuthStore.getState().user
  useAuthStore.setState({ user: { ...currentUser, ...user } })
}

function maybeQueueLevelUp(user, prevLifetime) {
  const newLevel = levelFromLifetime(user.lifetime_xp ?? prevLifetime)
  const oldLevel = levelFromLifetime(prevLifetime)
  if (newLevel > oldLevel && isLevelUpNotificationsEnabled(user)) {
    useLevelUpStore.getState().queueShow(newLevel, MOTION.taskComplete.levelUpDeferMs)
  }
}

function notifyCompletionReward(completed, reward, user, prevLifetime) {
  if (completed && reward?.pending) {
    useToastStore.getState().showSuccess(`+${reward.pendingXp} XP pending approval`)
    return
  }
  if (reward?.pendingCancelled) {
    useToastStore.getState().showSuccess('XP approval request cancelled')
    return
  }
  if (completed && reward?.xpDelta > 0) {
    useToastStore.getState().showSuccess(`+${reward.xpDelta} XP`)
    maybeQueueLevelUp(user, prevLifetime)
  }
}

function resolveLevelUp(completed, user, prevLifetime) {
  if (!completed || !user) return null
  const newLevel = levelFromLifetime(user.lifetime_xp ?? prevLifetime)
  const oldLevel = levelFromLifetime(prevLifetime)
  if (newLevel > oldLevel && isLevelUpNotificationsEnabled(user)) return newLevel
  return null
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
    applyOptimisticToggle(set, id, completed)

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
        syncUserFromCompletion(user)
        notifyCompletionReward(completed, reward, user, prevLifetime)
      }
      return {
        task: updated,
        user,
        reward,
        levelUp: resolveLevelUp(completed, user, prevLifetime),
      }
    } catch (err) {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? task : t)),
        error: err.message,
      }))
      throw err
    }
  },
}))
