import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LevelUp from '../../overlays/LevelUp'

describe('LevelUp overlay', () => {
  it('renders celebration modal at level boundary', () => {
    const onContinue = vi.fn()
    render(<LevelUp level={3} onContinue={onContinue} />)

    expect(screen.getByText('Level Up!')).toBeInTheDocument()
    expect(screen.getByText(/Level 3/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onContinue).toHaveBeenCalled()
  })

  it('renders nothing when level is null', () => {
    const { container } = render(<LevelUp level={null} onContinue={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
