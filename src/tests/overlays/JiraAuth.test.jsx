import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

const mocks = vi.hoisted(() => ({
  startJiraOAuth: vi.fn(),
  fetchJiraOAuthStatus: vi.fn(),
  connectJira: vi.fn(),
  isLoading: false,
}))

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector) => selector(mocks),
}))

import JiraAuth from '../../overlays/JiraAuth'

function renderOverlay(props = {}, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <JiraAuth {...props} />
    </MemoryRouter>,
  )
}

describe('JiraAuth overlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isLoading = false
    mocks.fetchJiraOAuthStatus.mockResolvedValue({ available: true })
    mocks.startJiraOAuth.mockResolvedValue({ ok: true })
    mocks.connectJira.mockResolvedValue({ ok: true })
  })

  it('shows the OAuth button and secure-OAuth footer when OAuth is available', async () => {
    renderOverlay()

    expect(await screen.findByRole('button', { name: 'Connect with Jira' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /advanced: use api token/i })).toBeInTheDocument()
    expect(screen.getByText(/secure Atlassian OAuth/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Jira API token')).not.toBeInTheDocument()
  })

  it('falls back to the manual token form when OAuth is unavailable', async () => {
    mocks.fetchJiraOAuthStatus.mockResolvedValue({ available: false })
    renderOverlay()

    expect(await screen.findByLabelText('Jira API token')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Connect with Jira' })).not.toBeInTheDocument()
    expect(screen.getByText(/personal API token/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /back to oauth/i })).not.toBeInTheDocument()
  })

  it('starts OAuth with the current path as returnTo', async () => {
    renderOverlay({}, { route: '/settings' })

    fireEvent.click(await screen.findByRole('button', { name: 'Connect with Jira' }))
    await waitFor(() => expect(mocks.startJiraOAuth).toHaveBeenCalledWith('/settings'))
    expect(screen.queryByText(/failed to start/i)).not.toBeInTheDocument()
  })

  it('maps the /signup path to a /dashboard returnTo', async () => {
    renderOverlay({}, { route: '/signup' })

    fireEvent.click(await screen.findByRole('button', { name: 'Connect with Jira' }))
    await waitFor(() => expect(mocks.startJiraOAuth).toHaveBeenCalledWith('/dashboard'))
  })

  it('shows the returned error when starting OAuth fails', async () => {
    mocks.startJiraOAuth.mockResolvedValue({ ok: false, error: 'OAuth exploded' })
    renderOverlay()

    fireEvent.click(await screen.findByRole('button', { name: 'Connect with Jira' }))
    expect(await screen.findByText('OAuth exploded')).toBeInTheDocument()
  })

  it('shows a default error when starting OAuth fails without a message', async () => {
    mocks.startJiraOAuth.mockResolvedValue({ ok: false })
    renderOverlay()

    fireEvent.click(await screen.findByRole('button', { name: 'Connect with Jira' }))
    expect(await screen.findByText('Failed to start Jira connection.')).toBeInTheDocument()
  })

  it('toggles between the manual token form and OAuth', async () => {
    renderOverlay()

    fireEvent.click(await screen.findByRole('button', { name: /advanced: use api token/i }))
    expect(screen.getByLabelText('Jira API token')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /back to oauth/i }))
    await waitFor(() => expect(screen.queryByLabelText('Jira API token')).not.toBeInTheDocument())
  })

  it('validates that a token is entered before connecting manually', async () => {
    mocks.fetchJiraOAuthStatus.mockResolvedValue({ available: false })
    renderOverlay()

    await screen.findByLabelText('Jira API token')
    fireEvent.click(screen.getByRole('button', { name: 'Connect with token' }))

    expect(await screen.findByText('Enter your Jira API token to connect.')).toBeInTheDocument()
    expect(mocks.connectJira).not.toHaveBeenCalled()
  })

  it('connects with a trimmed token and calls onConnect on success', async () => {
    const onConnect = vi.fn()
    mocks.fetchJiraOAuthStatus.mockResolvedValue({ available: false })
    renderOverlay({ onConnect })

    const input = await screen.findByLabelText('Jira API token')
    fireEvent.change(input, { target: { value: '  secret-token  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Connect with token' }))

    await waitFor(() => expect(mocks.connectJira).toHaveBeenCalledWith('secret-token'))
    await waitFor(() => expect(onConnect).toHaveBeenCalledTimes(1))
  })

  it('shows the returned error when a manual connection fails', async () => {
    mocks.fetchJiraOAuthStatus.mockResolvedValue({ available: false })
    mocks.connectJira.mockResolvedValue({ ok: false, error: 'Bad token' })
    renderOverlay()

    const input = await screen.findByLabelText('Jira API token')
    fireEvent.change(input, { target: { value: 'tok' } })
    fireEvent.click(screen.getByRole('button', { name: 'Connect with token' }))

    expect(await screen.findByText('Bad token')).toBeInTheDocument()
  })

  it('shows a default error when a manual connection fails without a message', async () => {
    mocks.fetchJiraOAuthStatus.mockResolvedValue({ available: false })
    mocks.connectJira.mockResolvedValue({ ok: false })
    renderOverlay()

    const input = await screen.findByLabelText('Jira API token')
    fireEvent.change(input, { target: { value: 'tok' } })
    fireEvent.click(screen.getByRole('button', { name: 'Connect with token' }))

    expect(await screen.findByText('Failed to connect Jira.')).toBeInTheDocument()
  })

  it('reflects the loading state in both action buttons', async () => {
    mocks.isLoading = true
    renderOverlay()

    expect(await screen.findByRole('button', { name: 'Redirecting…' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /advanced: use api token/i }))
    expect(screen.getByRole('button', { name: 'Connecting…' })).toBeDisabled()
  })

  it('calls onClose from the close button', async () => {
    const onClose = vi.fn()
    renderOverlay({ onClose })

    await screen.findByRole('button', { name: 'Connect with Jira' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking the backdrop', async () => {
    const onClose = vi.fn()
    const { container } = renderOverlay({ onClose })

    await screen.findByRole('button', { name: 'Connect with Jira' })
    fireEvent.click(container.firstChild)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onSkip when provided for "Skip for now"', async () => {
    const onSkip = vi.fn()
    const onClose = vi.fn()
    renderOverlay({ onSkip, onClose })

    await screen.findByRole('button', { name: 'Connect with Jira' })
    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }))
    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('falls back to onClose for "Skip for now" when no onSkip is given', async () => {
    const onClose = vi.fn()
    renderOverlay({ onClose })

    await screen.findByRole('button', { name: 'Connect with Jira' })
    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
