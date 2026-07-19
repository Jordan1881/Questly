import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHeroMotion } from '../../../components/motion/AnimatedHero'

vi.mock('@gsap/react', async () => {
  const React = await vi.importActual('react')
  return {
    useGSAP: (cb) => {
      React.useLayoutEffect(() => {
        cb()
      })
    },
  }
})

const { tlMock, gsapMock } = vi.hoisted(() => {
  const tl = { from: vi.fn() }
  tl.from.mockReturnValue(tl)
  return {
    tlMock: tl,
    gsapMock: {
      timeline: vi.fn(() => tl),
      to: vi.fn(),
    },
  }
})

vi.mock('../../../design-system/motion', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    gsap: gsapMock,
  }
})

describe('useHeroMotion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tlMock.from.mockReturnThis()
  })

  it('returns a ref object', () => {
    const { result } = renderHook(() => useHeroMotion())
    expect(result.current).toHaveProperty('current')
  })

  it('builds the entrance timeline with staggered from() steps', () => {
    renderHook(() => useHeroMotion())

    expect(gsapMock.timeline).toHaveBeenCalledTimes(1)
    // logo, title, subtitle, cta, footer
    expect(tlMock.from).toHaveBeenCalledTimes(5)
    expect(tlMock.from.mock.calls[0][0]).toBe('[data-hero-logo]')
  })

  it('kicks off the ambient blob animation', () => {
    renderHook(() => useHeroMotion())

    expect(gsapMock.to).toHaveBeenCalledTimes(1)
    const [selector, vars] = gsapMock.to.mock.calls[0]
    expect(selector).toBe('[data-motion-blob]')
    expect(vars).toMatchObject({ repeat: -1, yoyo: true })
  })
})
