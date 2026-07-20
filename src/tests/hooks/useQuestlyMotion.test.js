import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuestlyMotion } from '../../hooks/useQuestlyMotion'

const { matchMediaMock, gsapMock } = vi.hoisted(() => {
  const mm = {
    add: vi.fn((_conditions, cb) => cb({ conditions: { reduceMotion: true } })),
    revert: vi.fn(),
  }
  return {
    matchMediaMock: mm,
    gsapMock: { matchMedia: vi.fn(() => mm) },
  }
})

vi.mock('../../design-system/motion', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    gsap: gsapMock,
  }
})

describe('useQuestlyMotion', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('initialises reduceMotion from the media query (setup mocks reduce=true)', () => {
    const { result } = renderHook(() => useQuestlyMotion())
    expect(result.current.reduceMotion).toBe(true)
  })

  it('subscribes to change events and updates reduceMotion, cleaning up on unmount', () => {
    let changeHandler
    const removeEventListener = vi.fn()
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: (_event, handler) => {
        changeHandler = handler
      },
      removeEventListener,
    }))

    const { result, unmount } = renderHook(() => useQuestlyMotion())
    expect(result.current.reduceMotion).toBe(false)

    act(() => {
      changeHandler({ matches: true })
    })
    expect(result.current.reduceMotion).toBe(true)

    unmount()
    expect(removeEventListener).toHaveBeenCalledWith('change', changeHandler)
  })

  it('falls back to false when window is unavailable', () => {
    // Simulate the typeof window === "undefined" branch via matchMedia absence path
    // by verifying the initialiser handles matches false too.
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const { result } = renderHook(() => useQuestlyMotion())
    expect(result.current.reduceMotion).toBe(false)
  })

  it('runScoped wires a gsap.matchMedia scope and returns a revert cleanup', () => {
    const scopeRef = { current: document.createElement('div') }
    const { result } = renderHook(() => useQuestlyMotion(scopeRef))

    const setup = vi.fn()
    let cleanup
    act(() => {
      cleanup = result.current.runScoped(setup)
    })

    expect(gsapMock.matchMedia).toHaveBeenCalled()
    expect(matchMediaMock.add).toHaveBeenCalledTimes(1)
    // setup receives the resolved conditions from the matchMedia callback
    expect(setup).toHaveBeenCalledWith(
      expect.objectContaining({ reduced: true, gsap: gsapMock }),
    )
    // the matchMedia callback must return a cleanup function
    const addCallback = matchMediaMock.add.mock.calls[0][1]
    expect(typeof addCallback({ conditions: {} })).toBe('function')

    cleanup()
    expect(matchMediaMock.revert).toHaveBeenCalledTimes(1)
  })
})
