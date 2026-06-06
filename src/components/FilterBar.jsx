import { DIFFICULTY_STYLES } from './DifficultyBadge'

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

export default function FilterBar({ statusFilter, difficultyFilter, onStatusChange, onDifficultyChange }) {
  const activeStyle = {
    background: '#942fcd',
    color: 'white',
    border: 'none',
    boxShadow: '0px 2px 6px rgba(148,47,205,0.2)',
  }

  const inactiveStyle = {
    background: 'white',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
  }

  return (
    <div className="flex items-center gap-3 mb-6 flex-wrap">
      {STATUS_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onStatusChange(f.id)}
          className="h-[41px] px-5 rounded-[8px] text-[14px] cursor-pointer transition-all duration-200"
          style={statusFilter === f.id ? activeStyle : inactiveStyle}
        >
          {f.label}
        </button>
      ))}
      <div className="w-px h-6 bg-[#e5e7eb]" />
      {DIFFICULTY_FILTERS.filter((f) => f.id !== 'all').map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onDifficultyChange(difficultyFilter === f.id ? 'all' : f.id)}
          className="h-[41px] px-5 rounded-[8px] text-[14px] cursor-pointer transition-all duration-200"
          style={
            difficultyFilter === f.id
              ? activeStyle
              : { background: 'white', color: f.color, border: `1px solid ${f.border}` }
          }
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
