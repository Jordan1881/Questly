import { create } from 'zustand'

export const useXpStore = create((set) => ({
  userXP: 1250,
  userCoins: 125,
  setUserXP: (xp) => set({ userXP: xp }),
  setUserCoins: (coins) => set({ userCoins: coins }),
  addXP: (amount) => set((s) => ({ userXP: s.userXP + amount })),
  spendCoins: (amount) => set((s) => ({ userCoins: s.userCoins - amount })),
}))
