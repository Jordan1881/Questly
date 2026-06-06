import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RewardCard from '../../components/RewardCard'

const reward = {
  id: 'r1',
  title: 'Gift Card',
  description: 'Nice reward',
  xpCost: 50,
  stockCount: 3,
  allExpired: false,
}

describe('RewardCard', () => {
  it('disables buy and shows Not enough XP when balance is low', () => {
    render(<RewardCard reward={reward} userXp={10} onBuy={vi.fn()} />)

    const buyButton = screen.getByRole('button', { name: 'Buy' })
    expect(buyButton).toBeDisabled()
    expect(screen.getByText('Not enough XP')).toBeInTheDocument()
  })

  it('shows expired state when all coupons expired', () => {
    render(
      <RewardCard
        reward={{ ...reward, stockCount: 0, allExpired: true }}
        userXp={100}
        onBuy={vi.fn()}
      />,
    )

    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByText('Out of stock')).toBeInTheDocument()
  })

  it('does not call onBuy when disabled', () => {
    const onBuy = vi.fn()
    render(<RewardCard reward={reward} userXp={10} onBuy={onBuy} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }))
    expect(onBuy).not.toHaveBeenCalled()
  })
})
