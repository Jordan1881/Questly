import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDashboardStore } from '../../stores/dashboardStore'
import { useXpStore } from '../../stores/xpStore'
import { useAuthStore } from '../../stores/authStore'
import { useSprintStore } from '../../stores/sprintStore'
import { apiFetch } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}))

const DASHBOARD_PAYLOAD = {
  xp: { current_sprint_xp: 450, lifetime_xp: 1450, coin_balance: 14, level: 2 },
  streak: 4,
  activeSprint: { id: 's1', name: 'Dash Sprint', status: 'active' },
  highPriorityTasks: [{ id: 't1', title: 'Urgent fix', highPriority: true, done: false }],
}

describe('dashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.setState({ data: null, isLoading: false, error: null })
    useXpStore.setState({ userXP: 0, userCoins: 0 })
    useAuthStore.setState({ user: { streak_days: 0, current_sprint_xp: 0, lifetime_xp: 0, coin_balance: 0 } })
    useSprintStore.setState({ activeSprint: null, isLoading: false, error: null })
    vi.clearAllMocks()
  })

  it('fetchDashboard loads data and syncs related stores', async () => {
    apiFetch.mockResolvedValue(DASHBOARD_PAYLOAD)

    const data = await useDashboardStore.getState().fetchDashboard()

    expect(apiFetch).toHaveBeenCalledWith('/api/users/me/dashboard')
    expect(data.highPriorityTasks).toHaveLength(1)
    expect(useDashboardStore.getState().data).toEqual(DASHBOARD_PAYLOAD)
    expect(useXpStore.getState().userXP).toBe(450)
    expect(useAuthStore.getState().user.streak_days).toBe(4)
    expect(useSprintStore.getState().activeSprint.name).toBe('Dash Sprint')
  })

  it('fetchDashboard sets error on failure', async () => {
    apiFetch.mockRejectedValue(new Error('Server error'))

    await expect(useDashboardStore.getState().fetchDashboard()).rejects.toThrow('Server error')
    expect(useDashboardStore.getState().error).toBe('Server error')
    expect(useDashboardStore.getState().isLoading).toBe(false)
  })
})
