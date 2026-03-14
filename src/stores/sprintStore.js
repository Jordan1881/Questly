import { create } from 'zustand'

// Scaffold — will be populated from the API in M5 (Sprint management)
export const useSprintStore = create((set) => ({
  activeSprint: null,
  setSprint: (sprint) => set({ activeSprint: sprint }),
  closeSprint: () => set({ activeSprint: null }),
}))
