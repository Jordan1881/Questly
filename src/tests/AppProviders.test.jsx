import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppProviders from '../AppProviders'
import { setApiErrorHandler } from '../lib/api'
import { useToastStore } from '../stores/toastStore'
import { useLevelUpStore } from '../stores/levelUpStore'

vi.mock('../lib/api', () => ({
  setApiErrorHandler: vi.fn(),
}))

vi.mock('../components/Toast', () => ({
  default: () => <div data-testid="toast" />,
}))

vi.mock('../overlays/SessionExpired', () => ({
  default: () => <div data-testid="session-expired" />,
}))

vi.mock('../overlays/LevelUp', () => ({
  default: ({ level, onContinue }) => (
    <button data-testid="level-up" data-level={String(level)} onClick={onContinue}>
      level-up
    </button>
  ),
}))

describe('AppProviders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLevelUpStore.setState({ level: null, lastShownLevel: 0 })
    useToastStore.setState({ message: null, type: 'success' })
  })

  it('renders children alongside the global overlays', () => {
    render(
      <AppProviders>
        <p>app content</p>
      </AppProviders>,
    )

    expect(screen.getByText('app content')).toBeInTheDocument()
    expect(screen.getByTestId('toast')).toBeInTheDocument()
    expect(screen.getByTestId('session-expired')).toBeInTheDocument()
    expect(screen.getByTestId('level-up')).toBeInTheDocument()
  })

  it('registers the api error handler on mount and clears it on unmount', () => {
    const { unmount } = render(
      <AppProviders>
        <p>content</p>
      </AppProviders>,
    )

    expect(setApiErrorHandler).toHaveBeenCalledTimes(1)
    expect(typeof setApiErrorHandler.mock.calls[0][0]).toBe('function')

    unmount()
    expect(setApiErrorHandler).toHaveBeenCalledTimes(2)
    expect(setApiErrorHandler.mock.calls[1][0]).toBeNull()
  })

  it('routes api errors to the toast store as an error message', () => {
    const showError = vi.fn()
    useToastStore.setState({ showError })

    render(
      <AppProviders>
        <p>content</p>
      </AppProviders>,
    )

    const handler = setApiErrorHandler.mock.calls[0][0]
    handler({ message: 'network down' })
    expect(showError).toHaveBeenCalledWith('network down')
  })

  it('passes the current level and dismiss handler to the level-up overlay', () => {
    useLevelUpStore.setState({ level: 5, lastShownLevel: 4 })

    render(
      <AppProviders>
        <p>content</p>
      </AppProviders>,
    )

    const levelUp = screen.getByTestId('level-up')
    expect(levelUp).toHaveAttribute('data-level', '5')

    levelUp.click()
    expect(useLevelUpStore.getState().level).toBeNull()
  })
})
