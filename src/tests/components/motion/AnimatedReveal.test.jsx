import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import AnimatedReveal from '../../../components/motion/AnimatedReveal'

// Run the useGSAP callback inside a layout effect so refs are populated.
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

const { gsapMock } = vi.hoisted(() => ({
  gsapMock: {
    from: vi.fn(),
    set: vi.fn(),
    to: vi.fn(),
  },
}))

vi.mock('../../../design-system/motion', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    gsap: gsapMock,
    prefersReducedMotion: vi.fn(() => false),
  }
})

async function getMotion() {
  return import('../../../design-system/motion')
}

describe('AnimatedReveal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    const { prefersReducedMotion } = await getMotion()
    prefersReducedMotion.mockReturnValue(false)
  })

  it('renders children inside a div by default with className', () => {
    const { container } = render(
      <AnimatedReveal className="wrap">
        <span data-motion-reveal>one</span>
      </AnimatedReveal>,
    )
    const root = container.firstChild
    expect(root.tagName).toBe('DIV')
    expect(root).toHaveClass('wrap')
    expect(root).toHaveTextContent('one')
  })

  it('renders using a custom tag via the `as` prop', () => {
    const { container } = render(
      <AnimatedReveal as="section">
        <span data-motion-reveal>x</span>
      </AnimatedReveal>,
    )
    expect(container.firstChild.tagName).toBe('SECTION')
  })

  it('early returns when there are no reveal items (no gsap calls)', () => {
    render(
      <AnimatedReveal>
        <span>no reveal marker here</span>
      </AnimatedReveal>,
    )
    expect(gsapMock.from).not.toHaveBeenCalled()
    expect(gsapMock.set).not.toHaveBeenCalled()
  })

  it('sets items visible immediately when reduced motion is preferred', async () => {
    const { prefersReducedMotion } = await getMotion()
    prefersReducedMotion.mockReturnValue(true)

    render(
      <AnimatedReveal>
        <span data-motion-reveal>a</span>
        <span data-motion-reveal>b</span>
      </AnimatedReveal>,
    )

    expect(gsapMock.set).toHaveBeenCalledTimes(1)
    const [items, vars] = gsapMock.set.mock.calls[0]
    expect(items.length).toBe(2)
    expect(vars).toEqual({ autoAlpha: 1, y: 0 })
    expect(gsapMock.from).not.toHaveBeenCalled()
  })

  it('animates items with gsap.from when motion is allowed', () => {
    render(
      <AnimatedReveal stagger={0.2} y={40} delay={0.1}>
        <span data-motion-reveal>a</span>
      </AnimatedReveal>,
    )

    expect(gsapMock.from).toHaveBeenCalledTimes(1)
    const [, vars] = gsapMock.from.mock.calls[0]
    expect(vars).toMatchObject({ autoAlpha: 0, y: 40, stagger: 0.2, delay: 0.1 })
    expect(gsapMock.set).not.toHaveBeenCalled()
  })
})
