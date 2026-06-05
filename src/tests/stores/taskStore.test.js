import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useTaskStore } from '../../stores/taskStore'
import { createMockTask } from '../factories/index'
import { apiFetch } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}))

const RESET = {
  tasks: [],
  isLoading: false,
  error: null,
  lastSyncedAt: null,
}

describe('taskStore', () => {
  beforeEach(() => {
    useTaskStore.setState(RESET)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initialises with an empty task list', () => {
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('setTasks replaces the task list and updateTask patches a task', () => {
    const tasks = [createMockTask({ title: 'Original' }), createMockTask()]
    useTaskStore.getState().setTasks(tasks)
    expect(useTaskStore.getState().tasks).toHaveLength(2)
    useTaskStore.getState().updateTask(tasks[0].id, { title: 'Updated' })
    expect(useTaskStore.getState().tasks[0].title).toBe('Updated')
  })

  it('fetchTasks loads tasks from the API', async () => {
    apiFetch.mockResolvedValue({
      tasks: [createMockTask({ title: 'Synced task', jiraId: 'SCRUM-1' })],
    })

    const tasks = await useTaskStore.getState().fetchTasks()

    expect(apiFetch).toHaveBeenCalledWith('/api/tasks')
    expect(tasks).toHaveLength(1)
    expect(useTaskStore.getState().tasks[0].title).toBe('Synced task')
  })

  it('syncWorkspaceTasks records lastSyncedAt on success', async () => {
    apiFetch.mockResolvedValue({ synced: 2, created: 2, updated: 0, assignments: 2 })

    const result = await useTaskStore.getState().syncWorkspaceTasks('ws-1')

    expect(apiFetch).toHaveBeenCalledWith('/api/tasks/sync/ws-1', { method: 'POST' })
    expect(result.synced).toBe(2)
    expect(useTaskStore.getState().lastSyncedAt).toBeTruthy()
  })

  it('toggleTaskCompletion updates completion through the API', async () => {
    const task = createMockTask({ done: false })
    useTaskStore.setState({ tasks: [task] })
    apiFetch.mockResolvedValue({
      task: { ...task, done: true },
      user: { current_sprint_xp: 40, lifetime_xp: 40, coin_balance: 4 },
      reward: { xpDelta: 40, coinsDelta: 4 },
    })

    await useTaskStore.getState().toggleTaskCompletion(task.id)

    expect(apiFetch).toHaveBeenCalledWith(`/api/tasks/${task.id}/completion`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    })
    expect(useTaskStore.getState().tasks[0].done).toBe(true)
  })
})
