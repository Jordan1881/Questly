import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CouponCard from '../../components/CouponCard'

const purchase = {
  id: 'p1',
  rewardTitle: 'Coffee Card',
  couponCode: 'COFFEE-9999',
  expiresAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
  coinsSpent: 4,
}

describe('CouponCard', () => {
  it('renders masked code and calls onDelete after confirm', () => {
    const onDelete = vi.fn()
    render(<CouponCard purchase={purchase} onDelete={onDelete} />)

    expect(screen.getByText('Coffee Card')).toBeInTheDocument()
    expect(screen.getByText('****-9999')).toBeInTheDocument()
    expect(screen.getByLabelText('Expiring soon')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Remove from My Rewards/i }))
    fireEvent.click(screen.getByRole('button', { name: /Confirm remove/i }))

    expect(onDelete).toHaveBeenCalledWith('p1')
  })
})
