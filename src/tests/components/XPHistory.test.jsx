import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import XPHistory from '../../components/XPHistory'

describe('XPHistory', () => {
  it('renders loading skeleton while fetching', () => {
    const { container } = render(<XPHistory transactions={[]} isLoading />)
    expect(container.querySelector('[aria-label="Loading"]')).toBeInTheDocument()
  })

  it('renders empty state when no transactions', () => {
    render(<XPHistory transactions={[]} />)
    expect(screen.getByText(/No XP transactions yet/)).toBeInTheDocument()
  })

  it('renders signed amounts and reason labels', () => {
    render(
      <XPHistory
        transactions={[
          { id: '1', amount: 40, reason: 'task_completed', createdAt: '2026-06-01T10:00:00Z' },
          { id: '2', amount: -40, reason: 'sprint_reset', createdAt: '2026-06-02T10:00:00Z' },
        ]}
      />,
    )

    expect(screen.getByText('+40 XP')).toBeInTheDocument()
    expect(screen.getByText('-40 XP')).toBeInTheDocument()
    expect(screen.getByText('Task completed')).toBeInTheDocument()
    expect(screen.getByText('Sprint reset')).toBeInTheDocument()
  })
})
