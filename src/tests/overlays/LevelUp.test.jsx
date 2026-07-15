import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LevelUp from '../../overlays/LevelUp'

const navigate = vi.fn()

vi.mock('../../router', () => ({
  router: { navigate },
}))

describe('LevelUp overlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders celebration modal at level boundary with shop CTA', () => {
    const onContinue = vi.fn()
    render(<LevelUp level={3} onContinue={onContinue} />)

    expect(screen.getByText('Level Up!')).toBeInTheDocument()
    expect(screen.getByText(/Level 3/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /keep questing/i }))
    expect(onContinue).toHaveBeenCalled()
  })

  it('navigates to Reward Shop from primary CTA', async () => {
    const onContinue = vi.fn()
    render(<LevelUp level={2} onContinue={onContinue} />)

    fireEvent.click(screen.getByRole('button', { name: /visit reward shop/i }))
    expect(onContinue).toHaveBeenCalled()
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/rewards')
    })
  })

  it('renders nothing when level is null', () => {
    const { container } = render(<LevelUp level={null} onContinue={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
