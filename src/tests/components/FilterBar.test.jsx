import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterBar, { filterTasks } from '../../components/FilterBar'

const tasks = [
  { id: '1', title: 'Open easy', difficulty: 'EASY', done: false, highPriority: false },
  { id: '2', title: 'Done hard', difficulty: 'HARD', done: true, highPriority: true },
  { id: '3', title: 'Open priority', difficulty: 'MEDIUM', done: false, highPriority: true },
]

describe('filterTasks', () => {
  it('returns all tasks when filters are all', () => {
    expect(filterTasks(tasks)).toHaveLength(3)
  })

  it('filters completed tasks only', () => {
    expect(filterTasks(tasks, { status: 'completed' })).toHaveLength(1)
    expect(filterTasks(tasks, { status: 'completed' })[0].title).toBe('Done hard')
  })

  it('filters high priority tasks only', () => {
    const result = filterTasks(tasks, { status: 'highpriority' })
    expect(result).toHaveLength(2)
    expect(result.every((t) => t.highPriority)).toBe(true)
  })

  it('combines completed status with difficulty using AND logic', () => {
    const result = filterTasks(tasks, { status: 'completed', difficulty: 'hard' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('combines high priority with medium difficulty', () => {
    const result = filterTasks(tasks, { status: 'highpriority', difficulty: 'medium' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })
})

describe('FilterBar', () => {
  it('invokes status and difficulty callbacks', () => {
    const onStatusChange = vi.fn()
    const onDifficultyChange = vi.fn()
    render(
      <FilterBar
        statusFilter="all"
        difficultyFilter="all"
        onStatusChange={onStatusChange}
        onDifficultyChange={onDifficultyChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Completed' }))
    expect(onStatusChange).toHaveBeenCalledWith('completed')

    fireEvent.click(screen.getByRole('button', { name: 'Hard' }))
    expect(onDifficultyChange).toHaveBeenCalledWith('hard')
  })
})
