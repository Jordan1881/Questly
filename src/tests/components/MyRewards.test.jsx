import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import MyRewards from '../../components/MyRewards'

const soon = new Date(Date.now() + 5 * 86_400_000).toISOString()
const purchases = [
  {
    id: 'p1',
    rewardTitle: 'Coffee Card',
    couponCode: 'COFFEE-1111',
    expiresAt: soon,
    coinsSpent: 40,
  },
  {
    id: 'p2',
    rewardTitle: 'Steam Card',
    couponCode: 'STEAM-2222',
    expiresAt: soon,
    coinsSpent: 70,
  },
]

describe('MyRewards', () => {
  it('renders coupon list from purchases', () => {
    render(
      <MemoryRouter>
        <MyRewards purchases={purchases} onDelete={vi.fn()} isLoading={false} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Coffee Card')).toBeInTheDocument()
    expect(screen.getByText('Steam Card')).toBeInTheDocument()
  })

  it('shows empty state when no purchases', () => {
    render(
      <MemoryRouter>
        <MyRewards purchases={[]} onDelete={vi.fn()} isLoading={false} />
      </MemoryRouter>,
    )

    expect(screen.getByText('No rewards yet')).toBeInTheDocument()
  })

  it('calls onDelete when coupon remove is confirmed', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    render(
      <MemoryRouter>
        <MyRewards purchases={purchases} onDelete={onDelete} isLoading={false} />
      </MemoryRouter>,
    )

    const removeButtons = screen.getAllByRole('button', { name: /Remove from My Rewards/i })
    fireEvent.click(removeButtons[0])
    fireEvent.click(screen.getAllByRole('button', { name: /Confirm remove/i })[0])

    expect(onDelete).toHaveBeenCalledWith('p1')
  })

  it('shows expiring soon warning on coupons near expiry', () => {
    render(
      <MemoryRouter>
        <MyRewards purchases={purchases} onDelete={vi.fn()} isLoading={false} />
      </MemoryRouter>,
    )

    expect(screen.getAllByLabelText('Expiring soon')).toHaveLength(2)
  })
})
