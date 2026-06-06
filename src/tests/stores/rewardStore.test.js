import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRewardStore } from '../../stores/rewardStore'

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '../../lib/api'

describe('rewardStore', () => {
  beforeEach(() => {
    useRewardStore.setState({ rewards: [], isLoading: false, error: null })
    vi.clearAllMocks()
  })

  it('fetchRewards stores rewards from API', async () => {
    apiFetch.mockResolvedValue({
      rewards: [{ id: 'r1', title: 'Coffee', xpCost: 40, stockCount: 2 }],
    })

    const rewards = await useRewardStore.getState().fetchRewards('ws-1')

    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/ws-1/rewards')
    expect(rewards).toHaveLength(1)
    expect(useRewardStore.getState().rewards[0].title).toBe('Coffee')
  })

  it('createReward prepends reward to list', async () => {
    apiFetch.mockResolvedValue({ reward: { id: 'r2', title: 'Lunch', xpCost: 50 } })

    const reward = await useRewardStore.getState().createReward('ws-1', {
      title: 'Lunch',
      xpCost: 50,
    })

    expect(reward.id).toBe('r2')
    expect(useRewardStore.getState().rewards[0].id).toBe('r2')
  })

  it('fetchRewards sets error on failure', async () => {
    apiFetch.mockRejectedValue(new Error('Forbidden'))

    await expect(useRewardStore.getState().fetchRewards('ws-1')).rejects.toThrow('Forbidden')
    expect(useRewardStore.getState().error).toBe('Forbidden')
  })

  it('deleteReward removes reward from list', async () => {
    useRewardStore.setState({ rewards: [{ id: 'r1' }, { id: 'r2' }] })
    apiFetch.mockResolvedValue(null)

    await useRewardStore.getState().deleteReward('r1')

    expect(useRewardStore.getState().rewards).toEqual([{ id: 'r2' }])
  })

  it('updateReward patches reward in list', async () => {
    useRewardStore.setState({ rewards: [{ id: 'r1', title: 'Old' }] })
    apiFetch.mockResolvedValue({ reward: { id: 'r1', title: 'New' } })

    const reward = await useRewardStore.getState().updateReward('r1', { title: 'New' })

    expect(reward.title).toBe('New')
    expect(useRewardStore.getState().rewards[0].title).toBe('New')
  })

  it('uploadCoupons updates reward stock in list', async () => {
    useRewardStore.setState({ rewards: [{ id: 'r1', stockCount: 0 }] })
    apiFetch.mockResolvedValue({ reward: { id: 'r1', stockCount: 2 } })

    await useRewardStore.getState().uploadCoupons('r1', ['CODE1', 'CODE2'])

    expect(useRewardStore.getState().rewards[0].stockCount).toBe(2)
  })
})
