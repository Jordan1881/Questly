import { create } from 'zustand'

let hideTimer = null

export const useToastStore = create((set) => ({
  message: null,
  type: 'success',

  show: (message, type = 'success') => {
    if (hideTimer) clearTimeout(hideTimer)
    set({ message, type })
    hideTimer = setTimeout(() => set({ message: null }), 3200)
  },

  showSuccess: (message) => {
    useToastStore.getState().show(message, 'success')
  },

  showError: (message) => {
    useToastStore.getState().show(message, 'error')
  },

  clear: () => set({ message: null }),
}))
