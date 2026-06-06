import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import XPProgressBar from '../../components/XPProgressBar'

describe('XPProgressBar', () => {
  it('renders level label and XP-to-next-level for given XP', () => {
    render(<XPProgressBar xp={650} />)

    expect(screen.getByText('Level 1')).toBeInTheDocument()
    expect(screen.getByText('650')).toBeInTheDocument()
    expect(screen.getByText(/350 XP/)).toBeInTheDocument()
    expect(screen.getByText(/to reach Level 2/)).toBeInTheDocument()
    expect(screen.getByText('65%')).toBeInTheDocument()
  })

  it('handles zero XP without errors', () => {
    render(<XPProgressBar xp={0} />)

    expect(screen.getByText('Level 1')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText(/to reach Level 2/)).toBeInTheDocument()
  })
})
