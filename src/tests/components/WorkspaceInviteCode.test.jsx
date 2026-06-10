import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WorkspaceInviteCode from '../../components/WorkspaceInviteCode'

describe('WorkspaceInviteCode', () => {
  let writeText

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders nothing without a code', () => {
    const { container } = render(<WorkspaceInviteCode code={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows workspace code and name in full mode', () => {
    render(<WorkspaceInviteCode code="ABCD1234" workspaceName="Acme Engineering" />)

    expect(screen.getByTestId('workspace-invite-code')).toBeInTheDocument()
    expect(screen.getByText('ABCD1234')).toBeInTheDocument()
    expect(screen.getByText(/Acme Engineering/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument()
  })

  it('copies code to clipboard', async () => {
    render(<WorkspaceInviteCode code="CODE5678" workspaceName="Team" />)

    fireEvent.click(screen.getByRole('button', { name: /copy code/i }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('CODE5678')
    })
    expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument()
  })

  it('renders compact mode', () => {
    render(<WorkspaceInviteCode code="XYZ98765" compact />)

    expect(screen.getByText('XYZ98765')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^copy$/i })).toBeInTheDocument()
    expect(screen.queryByTestId('workspace-invite-code')).not.toBeInTheDocument()
  })
})
