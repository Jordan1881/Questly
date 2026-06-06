import { describe, it, expect, beforeEach } from 'vitest'
import { useLevelUpStore } from '../../stores/levelUpStore'

describe('levelUpStore', () => {
  beforeEach(() => {
    useLevelUpStore.setState({ level: null, lastShownLevel: 0 })
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
})
