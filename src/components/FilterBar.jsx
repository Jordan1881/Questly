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

const baseBtnClass =
  'h-[41px] px-5 rounded-[var(--radius-md)] text-[length:var(--text-body)] cursor-pointer transition-all duration-200'

export default function FilterBar({ statusFilter, difficultyFilter, onStatusChange, onDifficultyChange }) {
  return (
    <div className="flex items-center gap-3 mb-6 flex-wrap">
      {STATUS_FILTERS.map((f) => {
        const active = statusFilter === f.id
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onStatusChange(f.id)}
            className={`${baseBtnClass} ${
              active
                ? 'bg-[color:var(--color-brand)] text-white border-0 shadow-[var(--shadow-primary-sm)]'
                : 'bg-[color:var(--color-bg)] text-[color:var(--color-text-muted)] border border-[color:var(--color-border-subtle)]'
            }`}
          >
            {f.label}
          </button>
        )
      })}
      <div className="w-px h-6 bg-[color:var(--color-border)]" />
      {DIFFICULTY_FILTERS.filter((f) => f.id !== 'all').map((f) => {
        const active = difficultyFilter === f.id
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onDifficultyChange(difficultyFilter === f.id ? 'all' : f.id)}
            className={`${baseBtnClass} ${
              active
                ? 'bg-[color:var(--color-brand)] text-white border-0 shadow-[var(--shadow-primary-sm)]'
                : 'bg-[color:var(--color-bg)] border'
            }`}
            style={
              active
                ? undefined
                : { color: f.color, borderColor: f.border }
            }
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}
