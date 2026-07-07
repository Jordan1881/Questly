import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProfileStore } from '../../stores/profileStore'
import { useToastStore } from '../../stores/toastStore'

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '../../lib/api'

describe('profileStore', () => {
  beforeEach(() => {
    useProfileStore.setState({ profile: null, purchases: [], isLoading: false, error: null })
    useToastStore.setState({ message: null, type: 'success' })
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
    expect(useToastStore.getState().message).toBe('Removed from My Rewards')
  })

  it('updateProfile stores returned profile', async () => {
    apiFetch.mockResolvedValue({ profile: { username: 'newdev', avatarUrl: null, email: 'a@b.com', age: 25 } })

    const profile = await useProfileStore.getState().updateProfile({ username: 'newdev' })

    expect(profile.username).toBe('newdev')
    expect(useProfileStore.getState().profile.username).toBe('newdev')
  })

  it('updatePreferences stores returned preferences', async () => {
    apiFetch.mockResolvedValue({
      profile: { username: 'dev', preferences: { levelUpNotifications: false } },
    })

    await useProfileStore.getState().updatePreferences({ levelUpNotifications: false })

    expect(useProfileStore.getState().profile.preferences.levelUpNotifications).toBe(false)
  })

  it('fetchProfile sets error on failure', async () => {
    apiFetch.mockRejectedValue(new Error('Server error'))

    await expect(useProfileStore.getState().fetchProfile()).rejects.toThrow('Server error')
    expect(useProfileStore.getState().error).toBe('Server error')
  })

  it('deletePurchase restores purchases when API fails', async () => {
    useProfileStore.setState({ purchases: [{ id: 'p1' }, { id: 'p2' }] })
    apiFetch.mockRejectedValue(new Error('Delete failed'))

    await expect(useProfileStore.getState().deletePurchase('p1')).rejects.toThrow('Delete failed')
    expect(useProfileStore.getState().purchases).toEqual([{ id: 'p1' }, { id: 'p2' }])
    expect(useProfileStore.getState().error).toBe('Delete failed')
  })
})
