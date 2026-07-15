import { ECONOMY } from '../lib/economyCopy'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusBadge(status) {
  if (status === 'active') {
    return (
      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#166534]">
        Current season
      </span>
    )
  }
  if (status === 'completed') {
    return (
      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#f3f4f6] text-[#6b7280]">
        Completed
      </span>
    )
  }
  return (
    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#fef3c7] text-[#92400e]">
      {status}
    </span>
  )
}

export default function SprintStatusWidget({ sprint, className = '' }) {
  if (!sprint) {
    return (
      <div
        className={`rounded-[12px] border border-dashed border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-subtle)] p-5 shadow-[var(--shadow-soft-sm)] ${className}`}
      >
        <p className="text-[14px] font-medium text-[color:var(--color-gray-700)] mb-1">No active season</p>
        <p className="text-[12px] text-[color:var(--color-text-muted)]">{ECONOMY.noSeason}</p>
      </div>
    )
  }

  const daysRemaining = sprint.daysRemaining ?? null

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[16px] font-semibold text-[#1f2937]">{sprint.name}</h3>
        {statusBadge(sprint.status)}
      </div>
      <div className="flex flex-col gap-1 text-[13px] text-[#6b7280]">
        <p>
          <span className="text-[#374151] font-medium">Start:</span> {formatDate(sprint.startDate)}
        </p>
        <p>
          <span className="text-[#374151] font-medium">End:</span> {formatDate(sprint.endDate)}
        </p>
        {daysRemaining != null && sprint.status === 'active' && (
          <p>
            <span className="text-[#374151] font-medium">Days remaining:</span> {daysRemaining}
          </p>
        )}
        {sprint.status === 'active' && (
          <p className="text-[12px] text-[#6b7280] mt-1">{ECONOMY.seasonSpendHint}</p>
        )}
      </div>
    </div>
  )
}
