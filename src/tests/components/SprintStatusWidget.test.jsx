import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SprintStatusWidget from '../../components/SprintStatusWidget'

describe('SprintStatusWidget', () => {
  it('shows empty state when no sprint', () => {
    render(<SprintStatusWidget sprint={null} />)
    expect(screen.getByText('No active sprint')).toBeInTheDocument()
  })

  it('renders active sprint details and badge', () => {
    render(
      <SprintStatusWidget
        sprint={{
          name: 'Sprint 42',
          status: 'active',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
          daysRemaining: 10,
        }}
      />,
    )

    expect(screen.getByText('Sprint 42')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText(/Days remaining:/)).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })
})
