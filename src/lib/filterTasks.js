import { DIFFICULTY_STYLES } from './difficultyStyles'

export const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'highpriority', label: 'High Priority' },
]

export const DIFFICULTY_FILTERS = [
  { id: 'all', label: 'All difficulties' },
  { id: 'easy', label: 'Easy', border: DIFFICULTY_STYLES.EASY.border, color: DIFFICULTY_STYLES.EASY.color },
  { id: 'medium', label: 'Medium', border: DIFFICULTY_STYLES.MEDIUM.border, color: DIFFICULTY_STYLES.MEDIUM.color },
  { id: 'hard', label: 'Hard', border: DIFFICULTY_STYLES.HARD.border, color: DIFFICULTY_STYLES.HARD.color },
]

export function filterTasks(tasks, { status = 'all', difficulty = 'all' } = {}) {
  return tasks.filter((task) => {
    if (status === 'completed' && !task.done) return false
    if (status === 'highpriority' && !task.highPriority) return false
    if (difficulty !== 'all' && task.difficulty !== difficulty.toUpperCase()) return false
    return true
  })
}
