import { create } from 'zustand'
import { MOTION } from '../design-system/motion/config'

let pendingShowTimer = null

export const useLevelUpStore = create((set, get) => ({
  level: null,
  lastShownLevel: 0,
  show: (level) => {
    if (level <= get().lastShownLevel) return
    if (pendingShowTimer) {
      clearTimeout(pendingShowTimer)
      pendingShowTimer = null
    }
    set({ level, lastShownLevel: level })
  },
  queueShow: (level, delayMs = MOTION.taskComplete.levelUpDeferMs) => {
    if (level <= get().lastShownLevel) return
    if (pendingShowTimer) clearTimeout(pendingShowTimer)
    if (!delayMs || delayMs <= 0) {
      get().show(level)
      return
    }
    pendingShowTimer = setTimeout(() => {
      pendingShowTimer = null
      if (level > get().lastShownLevel) {
        set({ level, lastShownLevel: level })
      }
    }, delayMs)
  },
  dismiss: () => set({ level: null }),
  /** Test helper — clears any queued level-up timer */
  _clearPendingShow: () => {
    if (pendingShowTimer) {
      clearTimeout(pendingShowTimer)
      pendingShowTimer = null
    }
  },
}))
