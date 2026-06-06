import { create } from 'zustand'

export const useLevelUpStore = create((set, get) => ({
  level: null,
  lastShownLevel: 0,
  show: (level) => {
    if (level <= get().lastShownLevel) return
    set({ level, lastShownLevel: level })
  },
  dismiss: () => set({ level: null }),
}))
