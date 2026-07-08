import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTaskCompleteMotion } from '../../hooks/useTaskCompleteMotion'

const timelineMock = {
  fromTo: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  kill: vi.fn(),
}

vi.mock('../../design-system/motion', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    gsap: {
      ...actual.gsap,
      timeline: vi.fn((opts) => {
        queueMicrotask(() => opts?.onComplete?.())
        return timelineMock
      }),
      set: vi.fn(),
      fromTo: vi.fn(),
      to: vi.fn(),
    },
    prefersReducedMotion: vi.fn(() => false),
  }
})

describe('useTaskCompleteMotion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    const { prefersReducedMotion } = await import('../../design-system/motion')
    prefersReducedMotion.mockReturnValue(false)
  })

  it('skips GSAP timeline when prefers-reduced-motion is enabled', async () => {
    const { gsap, prefersReducedMotion } = await import('../../design-system/motion')
    prefersReducedMotion.mockReturnValue(true)

    const card = document.createElement('div')
    const checkbox = document.createElement('button')
    const cardRef = { current: card }
    const checkboxRef = { current: checkbox }

    const { result } = renderHook(() =>
      useTaskCompleteMotion({ cardRef, checkboxRef }),
    )

    await act(async () => {
      await result.current.playCompleteJuice({ xp: 40 })
    })

    expect(gsap.timeline).not.toHaveBeenCalled()
  })

  it('runs a GSAP timeline for completion juice when motion is allowed', async () => {
    const { gsap } = await import('../../design-system/motion')

    const card = document.createElement('div')
    const checkbox = document.createElement('button')
    const ghost = document.createElement('span')
    const cardRef = { current: card }
    const checkboxRef = { current: checkbox }
    const xpGhostRef = { current: ghost }

    const { result } = renderHook(() =>
      useTaskCompleteMotion({ cardRef, checkboxRef, xpGhostRef }),
    )

    await act(async () => {
      await result.current.playCompleteJuice({ xp: 40 })
    })

    expect(gsap.timeline).toHaveBeenCalled()
    expect(timelineMock.fromTo).toHaveBeenCalled()
    expect(timelineMock.to).toHaveBeenCalled()
  })

  it('omits XP bar tick when compressed mode is enabled', async () => {
    const bar = document.createElement('div')
    bar.setAttribute('data-xp-progress-bar', '')
    const fill = document.createElement('div')
    fill.setAttribute('data-xp-bar-fill', '')
    bar.appendChild(fill)
    document.body.appendChild(bar)

    const cardRef = { current: document.createElement('div') }
    const checkboxRef = { current: document.createElement('button') }

    const { result } = renderHook(() =>
      useTaskCompleteMotion({ cardRef, checkboxRef }),
    )

    timelineMock.to.mockClear()

    await act(async () => {
      await result.current.playCompleteJuice({ xp: 40, compressed: true })
    })

    const barTickCalls = timelineMock.to.mock.calls.filter(
      ([target]) => target === fill,
    )
    expect(barTickCalls).toHaveLength(0)

    document.body.removeChild(bar)
  })
})
