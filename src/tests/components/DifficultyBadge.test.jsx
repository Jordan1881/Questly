import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DifficultyBadge, { DIFFICULTY_STYLES } from '../../components/DifficultyBadge'

describe('DifficultyBadge', () => {
  it('exposes styles for all three difficulty levels', () => {
    expect(Object.keys(DIFFICULTY_STYLES)).toEqual(['HARD', 'MEDIUM', 'EASY'])
    expect(DIFFICULTY_STYLES.HARD).toEqual({
      bg: 'var(--color-error-50)',
      border: 'var(--color-error-300)',
      color: 'var(--color-error-600)',
    })
  })

  it.each(['HARD', 'MEDIUM', 'EASY'])('renders the %s label', (level) => {
    render(<DifficultyBadge level={level} />)
    expect(screen.getByText(level)).toBeInTheDocument()
  })

  it('applies the matching style tokens to the badge', () => {
    render(<DifficultyBadge level="EASY" />)
    const badge = screen.getByText('EASY')
    expect(badge.style.background).toBe('var(--color-success-50)')
    expect(badge.style.borderColor).toBe('var(--color-success-300)')
    expect(badge.style.color).toBe('var(--color-success-600)')
  })

  it('applies distinct colors for the HARD level', () => {
    render(<DifficultyBadge level="HARD" />)
    const badge = screen.getByText('HARD')
    expect(badge.style.color).toBe('var(--color-error-600)')
  })
})
