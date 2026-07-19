import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  sessionExpired: false,
  clearSessionExpired: vi.fn(),
}))

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector) => selector(mocks),
}))

import SessionExpired from '../../overlays/SessionExpired'

describe('SessionExpired overlay', () => {
  let assignMock
  let originalLocation

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.sessionExpired = false
    originalLocation = window.location
    assignMock = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: assignMock },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('renders nothing when the session is not expired', () => {
    const { container } = render(<SessionExpired />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the alert dialog when the session has expired', () => {
    mocks.sessionExpired = true
    render(<SessionExpired />)

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Session expired')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in again/i })).toBeInTheDocument()
  })

  it('clears the expired flag and redirects to /login on sign in', () => {
    mocks.sessionExpired = true
    render(<SessionExpired />)

    fireEvent.click(screen.getByRole('button', { name: /sign in again/i }))
    expect(mocks.clearSessionExpired).toHaveBeenCalledTimes(1)
    expect(assignMock).toHaveBeenCalledWith('/login')
  })
})
