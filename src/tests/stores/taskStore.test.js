import { describe, it, expect, beforeEach } from 'vitest'
import { useTaskStore } from '../../stores/taskStore'
import { createMockTask } from '../factories/index'

const defaultState = { tasks: [] }

describe('taskStore', () => {
  beforeEach(() => {
    useTaskStore.setState(defaultState)
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
})
