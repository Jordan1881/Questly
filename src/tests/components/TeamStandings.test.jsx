import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TeamStandings from '../../components/TeamStandings'

describe('TeamStandings', () => {
  it('shows empty copy when no standings', () => {
    render(<TeamStandings standings={[]} currentUserId="u1" />)
    expect(screen.getByText(/no teammates on the board/i)).toBeInTheDocument()
  })

  it('highlights current user and ranks by season score', () => {
    render(
      <TeamStandings
        currentUserId="u2"
        standings={[
          { userId: 'u1', username: 'Ada', seasonXp: 100, level: 1, rank: 1 },
          { userId: 'u2', username: 'Jordan', seasonXp: 40, level: 2, rank: 2 },
        ]}
      />,
    )

    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Jordan')).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
  })
})
