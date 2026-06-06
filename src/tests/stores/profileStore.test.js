import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProfileStore } from '../../stores/profileStore'

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '../../lib/api'

describe('profileStore', () => {
  beforeEach(() => {
    useProfileStore.setState({ profile: null, purchases: [], isLoading: false, error: null })
    vi.clearAllMocks()
  })

  it('fetchProfile stores profile and purchases', async () => {
    apiFetch.mockResolvedValue({
      profile: { username: 'dev', lifetimeXp: 100 },
      purchases: [{ id: 'p1' }],
    })

    await useProfileStore.getState().fetchProfile()

    expect(useProfileStore.getState().profile.username).toBe('dev')
    expect(useProfileStore.getState().purchases).toHaveLength(1)
  })

  it('deletePurchase optimistically removes purchase', async () => {
    useProfileStore.setState({ purchases: [{ id: 'p1' }, { id: 'p2' }] })
    apiFetch.mockResolvedValue({ purchase: { id: 'p1' } })

    await useProfileStore.getState().deletePurchase('p1')

    expect(useProfileStore.getState().purchases).toEqual([{ id: 'p2' }])
  })

  it('updateProfile stores returned profile', async () => {
    apiFetch.mockResolvedValue({ profile: { username: 'newdev', avatarUrl: null } })

    const profile = await useProfileStore.getState().updateProfile({ username: 'newdev' })

    expect(profile.username).toBe('newdev')
    expect(useProfileStore.getState().profile.username).toBe('newdev')
  })
})
