import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RewardManagementTab from '../../components/RewardManagementTab'

const rewards = [
  {
    id: 'r1',
    title: 'Nike 20% Off',
    description: 'Shoe discount',
    coinCost: 40,
    imageUrl: 'https://example.com/nike.png',
    stockCount: 2,
  },
]

const fetchMine = vi.fn().mockResolvedValue({ id: 'ws-1' })
const fetchRewards = vi.fn().mockResolvedValue(rewards)
const createReward = vi.fn()
const updateReward = vi.fn().mockResolvedValue({ id: 'r1', title: 'Nike 25% Off', coinCost: 50 })
const uploadCoupons = vi.fn()
const deleteReward = vi.fn()

vi.mock('../../stores/workspaceStore', () => ({
  useWorkspaceStore: (selector) =>
    selector({
      workspace: { id: 'ws-1' },
      fetchMine,
    }),
}))

vi.mock('../../stores/rewardStore', () => ({
  useRewardStore: (selector) =>
    selector({
      rewards,
      isLoading: false,
      fetchRewards,
      createReward,
      updateReward,
      uploadCoupons,
      deleteReward,
    }),
}))

describe('RewardManagementTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads rewards for the admin workspace', async () => {
    render(<RewardManagementTab />)

    await waitFor(() => {
      expect(fetchMine).toHaveBeenCalled()
      expect(fetchRewards).toHaveBeenCalledWith('ws-1')
    })

    expect(screen.getByText('Nike 20% Off')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('populates the form and saves edits', async () => {
    const user = userEvent.setup()
    render(<RewardManagementTab />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByRole('heading', { name: 'Edit reward' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Nike 20% Off')).toBeInTheDocument()
    expect(screen.getByDisplayValue('40')).toBeInTheDocument()

    const titleInput = screen.getByDisplayValue('Nike 20% Off')
    await user.clear(titleInput)
    await user.type(titleInput, 'Nike 25% Off')

    const xpInput = screen.getByDisplayValue('40')
    await user.clear(xpInput)
    await user.type(xpInput, '50')

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(updateReward).toHaveBeenCalledWith('r1', {
        title: 'Nike 25% Off',
        description: 'Shoe discount',
        coinCost: 50,
        imageUrl: 'https://example.com/nike.png',
      })
    })

    expect(screen.getByText('Reward updated successfully.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Add reward' })).toBeInTheDocument()
  })

  it('cancels edit mode and restores the create form', async () => {
    const user = userEvent.setup()
    render(<RewardManagementTab />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('heading', { name: 'Add reward' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create reward' })).toBeInTheDocument()
    expect(updateReward).not.toHaveBeenCalled()
  })
})
