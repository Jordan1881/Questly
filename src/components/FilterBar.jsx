import { STATUS_FILTERS, DIFFICULTY_FILTERS } from '../lib/filterTasks'

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
            className={`ds-filter-pill ds-focus-ring ${active ? 'ds-filter-pill--active' : 'ds-filter-pill--inactive'}`}
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
            className={`ds-filter-pill ds-focus-ring ${
              active ? 'ds-filter-pill--active' : 'ds-filter-pill--inactive'
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
