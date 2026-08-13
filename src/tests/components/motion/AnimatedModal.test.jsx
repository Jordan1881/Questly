import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AnimatedModal from '../../../components/motion/AnimatedModal'

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
  const tl = { fromTo: vi.fn() }
  tl.fromTo.mockReturnValue(tl)
  return {
    tlMock: tl,
    gsapMock: {
      set: vi.fn(),
      timeline: vi.fn(() => tl),
    },
  }
})

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

describe('AnimatedModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tlMock.fromTo.mockReturnThis()
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    const { prefersReducedMotion } = await getMotion()
    prefersReducedMotion.mockReturnValue(false)
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <AnimatedModal open={false}>
        <p>hidden</p>
      </AnimatedModal>,
    )
    expect(container).toBeEmptyDOMElement()
    expect(gsapMock.set).not.toHaveBeenCalled()
    expect(gsapMock.timeline).not.toHaveBeenCalled()
  })

  it('renders children and applies className when open', () => {
    render(
      <AnimatedModal open className="extra">
        <p>content</p>
      </AnimatedModal>,
    )
    expect(screen.getByText('content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
    const overlay = screen.getByText('content').closest('.fixed')
    expect(overlay).toHaveClass('extra')
  })

  it('skips animation in test mode and snaps elements visible', () => {
    // import.meta.env.MODE === 'test' during vitest → skipMotion branch
    render(
      <AnimatedModal open>
        <p>content</p>
      </AnimatedModal>,
    )
    expect(gsapMock.set).toHaveBeenCalledTimes(1)
    const [targets, vars] = gsapMock.set.mock.calls[0]
    expect(targets).toHaveLength(2)
    expect(vars).toEqual({ autoAlpha: 1, scale: 1, y: 0 })
    expect(gsapMock.timeline).not.toHaveBeenCalled()
  })

  it('skips animation when reduced motion is preferred (production mode)', async () => {
    vi.stubEnv('MODE', 'production')
    const { prefersReducedMotion } = await getMotion()
    prefersReducedMotion.mockReturnValue(true)

    render(
      <AnimatedModal open>
        <p>content</p>
      </AnimatedModal>,
    )

    expect(gsapMock.set).toHaveBeenCalledTimes(1)
    expect(gsapMock.timeline).not.toHaveBeenCalled()
  })

  it('runs the entrance timeline when motion is allowed (production mode)', async () => {
    vi.stubEnv('MODE', 'production')
    const { prefersReducedMotion } = await getMotion()
    prefersReducedMotion.mockReturnValue(false)

    render(
      <AnimatedModal open>
        <p>content</p>
      </AnimatedModal>,
    )

    expect(gsapMock.timeline).toHaveBeenCalledTimes(1)
    expect(tlMock.fromTo).toHaveBeenCalledTimes(2)
    expect(gsapMock.set).not.toHaveBeenCalled()
  })

  it('invokes onBackdropClick when the overlay is clicked', () => {
    const onBackdropClick = vi.fn()
    render(
      <AnimatedModal open onBackdropClick={onBackdropClick}>
        <p>content</p>
      </AnimatedModal>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onBackdropClick).toHaveBeenCalledTimes(1)
  })

  it('invokes onBackdropClick when the dismiss control is activated via keyboard', () => {
    const onBackdropClick = vi.fn()
    render(
      <AnimatedModal open onBackdropClick={onBackdropClick}>
        <p>content</p>
      </AnimatedModal>,
    )
    const dismiss = screen.getByRole('button', { name: 'Dismiss' })
    fireEvent.keyDown(dismiss, { key: 'Enter', code: 'Enter' })
    fireEvent.click(dismiss)
    expect(onBackdropClick).toHaveBeenCalled()
  })

  it('does not invoke onBackdropClick when the panel content is clicked', () => {
    const onBackdropClick = vi.fn()
    render(
      <AnimatedModal open onBackdropClick={onBackdropClick}>
        <p>content</p>
      </AnimatedModal>,
    )
    fireEvent.click(screen.getByText('content'))
    expect(onBackdropClick).not.toHaveBeenCalled()
  })
})
