import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useLevelUpStore } from '../../stores/levelUpStore'
import { MOTION } from '../../design-system/motion/config'

describe('levelUpStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useLevelUpStore.setState({ level: null, lastShownLevel: 0 })
    useLevelUpStore.getState()._clearPendingShow()
  })

  afterEach(() => {
    useLevelUpStore.getState()._clearPendingShow()
    vi.useRealTimers()
  })

  it('shows overlay for a new higher level', () => {
    useLevelUpStore.getState().show(2)
    expect(useLevelUpStore.getState().level).toBe(2)
    expect(useLevelUpStore.getState().lastShownLevel).toBe(2)
  })

  it('does not re-show the same or lower level', () => {
    useLevelUpStore.getState().show(3)
    useLevelUpStore.getState().dismiss()
    useLevelUpStore.getState().show(2)
    expect(useLevelUpStore.getState().level).toBeNull()
  })

  it('queueShow defers the overlay until the delay elapses', () => {
    useLevelUpStore.getState().queueShow(2, MOTION.taskComplete.levelUpDeferMs)
    expect(useLevelUpStore.getState().level).toBeNull()

    vi.advanceTimersByTime(MOTION.taskComplete.levelUpDeferMs)
    expect(useLevelUpStore.getState().level).toBe(2)
  })
})
