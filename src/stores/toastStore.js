import { create } from 'zustand'

let hideTimer = null

export const useToastStore = create((set) => ({
  message: null,
  show: (message) => {
    if (hideTimer) clearTimeout(hideTimer)
    set({ message })
    hideTimer = setTimeout(() => set({ message: null }), 3200)
  },
  clear: () => set({ message: null }),
}))
