import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RewardCard from '../../components/RewardCard'

const reward = {
  id: 'r1',
  title: 'Gift Card',
  description: 'Nice reward',
  coinCost: 5,
  stockCount: 3,
  allExpired: false,
}

describe('RewardCard', () => {
  it('disables buy and shows Not enough coins when balance is low', () => {
    render(<RewardCard reward={reward} userCoins={1} onBuy={vi.fn()} />)

    const buyButton = screen.getByRole('button', { name: 'Buy' })
    expect(buyButton).toBeDisabled()
    expect(screen.getByText('Not enough coins')).toBeInTheDocument()
  })

  it('shows expired state when all coupons expired', () => {
    render(
      <RewardCard
        reward={{ ...reward, stockCount: 0, allExpired: true }}
        userCoins={100}
        onBuy={vi.fn()}
      />,
    )

    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByText('Out of stock')).toBeInTheDocument()
  })

  it('does not call onBuy when disabled', () => {
    const onBuy = vi.fn()
    render(<RewardCard reward={reward} userCoins={1} onBuy={onBuy} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }))
    expect(onBuy).not.toHaveBeenCalled()
  })
})
