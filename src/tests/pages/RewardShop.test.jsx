import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import RewardShop from '../../pages/RewardShop'

const rewards = [
  {
    id: 'r1',
    title: 'Gift Card',
    description: 'Nice reward',
    xpCost: 50,
    stockCount: 3,
    allExpired: false,
  },
  {
    id: 'r2',
    title: 'Expired Promo',
    description: 'Old reward',
    xpCost: 20,
    stockCount: 0,
    allExpired: true,
  },
]

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector) =>
    selector({
      user: { workspace_id: 'ws-1', role: 'developer', username: 'dev1' },
      userRole: 'developer',
      logout: vi.fn(),
    }),
}))

vi.mock('../../stores/xpStore', () => ({
  useXpStore: (selector) => selector({ userXP: 10 }),
}))

vi.mock('../../stores/rewardStore', () => ({
  useRewardStore: (selector) =>
    selector({
      rewards,
      isLoading: false,
      isPurchasing: false,
      error: null,
      fetchRewards: vi.fn().mockResolvedValue(undefined),
      purchaseReward: vi.fn(),
    }),
}))

describe('RewardShop page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('disables buy and shows Not enough XP when sprint balance is low', () => {
    render(
      <MemoryRouter>
        <RewardShop />
      </MemoryRouter>,
    )

    const buyButtons = screen.getAllByRole('button', { name: 'Buy' })
    expect(buyButtons[0]).toBeDisabled()
    expect(screen.getByText('Not enough XP')).toBeInTheDocument()
  })

  it('shows expired badge when all coupons for a reward are expired', () => {
    render(
      <MemoryRouter>
        <RewardShop />
      </MemoryRouter>,
    )

    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByText('Expired Promo')).toBeInTheDocument()
  })
})
