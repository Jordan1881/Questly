import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TaskCard from '../../components/TaskCard'

vi.mock('../../hooks/useTaskCompleteMotion', () => ({
  useTaskCompleteMotion: () => ({
    playCompleteJuice: vi.fn().mockResolvedValue(undefined),
    killTimeline: vi.fn(),
  }),
}))

const baseTask = {
  id: 'task-1',
  title: 'Fix login bug',
  desc: 'Investigate auth flow',
  difficulty: 'HARD',
  jiraId: 'SCRUM-42',
  due: 'Mar 10, 2026',
  xp: 70,
  highPriority: true,
  done: false,
}

describe('TaskCard', () => {
  it('renders difficulty badge for task level', () => {
    render(<TaskCard task={baseTask} onToggle={vi.fn()} />)
    expect(screen.getByText('HARD')).toBeInTheDocument()
  })

  it('checkbox triggers onToggle with task id', async () => {
    const onToggle = vi.fn().mockResolvedValue({})
    render(<TaskCard task={baseTask} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }))
    expect(onToggle).toHaveBeenCalledWith('task-1')
  })

  it('shows completed styling when task is done', () => {
    render(<TaskCard task={{ ...baseTask, done: true }} onToggle={vi.fn()} />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })
})
