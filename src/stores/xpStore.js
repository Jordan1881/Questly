import { create } from 'zustand'

export const useXpStore = create((set) => ({
  userXP: 0,
  userCoins: 0,
  setUserXP: (xp) => set({ userXP: xp }),
  setUserCoins: (coins) => set({ userCoins: coins }),
  syncFromUser: (user) =>
    set({
      userXP: user?.current_sprint_xp ?? 0,
      userCoins: user?.coin_balance ?? 0,
    }),
  addXP: (amount) => set((s) => ({ userXP: s.userXP + amount })),
  spendCoins: (amount) => set((s) => ({ userCoins: Math.max(0, s.userCoins - amount) })),
}))
