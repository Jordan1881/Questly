import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useToastStore } from '../../stores/toastStore'

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToastStore.setState({ message: null, type: 'success' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('show sets message and type, then clears after timeout', () => {
    useToastStore.getState().show('Saved!', 'success')

    expect(useToastStore.getState().message).toBe('Saved!')
    expect(useToastStore.getState().type).toBe('success')

    vi.advanceTimersByTime(3200)
    expect(useToastStore.getState().message).toBeNull()
  })

  it('showSuccess delegates to show with success type', () => {
    useToastStore.getState().showSuccess('Done')

    expect(useToastStore.getState().message).toBe('Done')
    expect(useToastStore.getState().type).toBe('success')
  })

  it('showError delegates to show with error type', () => {
    useToastStore.getState().showError('Failed')

    expect(useToastStore.getState().message).toBe('Failed')
    expect(useToastStore.getState().type).toBe('error')
  })

  it('clear removes message immediately', () => {
    useToastStore.getState().show('Pending')
    useToastStore.getState().clear()

    expect(useToastStore.getState().message).toBeNull()
  })

  it('show clears previous hide timer when called again', () => {
    useToastStore.getState().show('First')
    vi.advanceTimersByTime(1000)
    useToastStore.getState().show('Second')

    vi.advanceTimersByTime(3200)
    expect(useToastStore.getState().message).toBeNull()
  })
})
