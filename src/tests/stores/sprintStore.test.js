import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSprintStore } from '../../stores/sprintStore'
import { createMockSprint } from '../factories/index'
import { apiFetch } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}))

const defaultState = { activeSprint: null, sprints: [], isLoading: false, error: null }

describe('sprintStore', () => {
  beforeEach(() => {
    useSprintStore.setState(defaultState)
    vi.clearAllMocks()
  })

  it('initialises with no active sprint', () => {
    expect(useSprintStore.getState().activeSprint).toBeNull()
  })

  it('setSprint sets the active sprint and closeSprint clears it', () => {
    const sprint = createMockSprint()
    useSprintStore.getState().setSprint(sprint)
    expect(useSprintStore.getState().activeSprint).toEqual(sprint)
    useSprintStore.getState().closeSprint()
    expect(useSprintStore.getState().activeSprint).toBeNull()
  })

  it('fetchActiveSprint loads active sprint for workspace', async () => {
    const sprint = createMockSprint({ name: 'Active' })
    apiFetch.mockResolvedValue({ sprint })

    const result = await useSprintStore.getState().fetchActiveSprint('ws-1')

    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/ws-1/sprints/active')
    expect(result.name).toBe('Active')
    expect(useSprintStore.getState().activeSprint).toEqual(sprint)
  })

  it('createSprint posts to workspace sprints endpoint', async () => {
    const sprint = createMockSprint({ name: 'New Sprint' })
    apiFetch.mockResolvedValue({ sprint })

    const result = await useSprintStore.getState().createSprint('ws-1', { name: 'New Sprint' })

    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/ws-1/sprints', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Sprint' }),
    })
    expect(result.name).toBe('New Sprint')
  })

  it('closeSprintById closes sprint and refetches list', async () => {
    apiFetch.mockResolvedValueOnce(null).mockResolvedValueOnce({ sprints: [] })

    await useSprintStore.getState().closeSprintById('sprint-1', 'ws-1')

    expect(apiFetch).toHaveBeenCalledWith('/api/sprints/sprint-1/close', { method: 'POST' })
    expect(useSprintStore.getState().activeSprint).toBeNull()
  })

  it('fetchActiveSprint clears sprint when workspace id missing', async () => {
    const result = await useSprintStore.getState().fetchActiveSprint(null)
    expect(result).toBeNull()
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('fetchSprints returns empty list without workspace id', async () => {
    const result = await useSprintStore.getState().fetchSprints(null)
    expect(result).toEqual([])
    expect(useSprintStore.getState().sprints).toEqual([])
  })

  it('createSprint surfaces API errors', async () => {
    apiFetch.mockRejectedValue(new Error('409 conflict'))
    await expect(
      useSprintStore.getState().createSprint('ws-1', { name: 'Dup' }),
    ).rejects.toThrow('409 conflict')
    expect(useSprintStore.getState().error).toBe('409 conflict')
  })
})
