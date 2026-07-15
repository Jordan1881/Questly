import { SkeletonList } from './Skeleton'

const REASON_LABELS = {
  task_completed: 'Task completed',
  reward_purchased: 'Reward purchased',
  sprint_reset: 'Sprint reset',
}

function formatReason(reason) {
  return REASON_LABELS[reason] || reason?.replace(/_/g, ' ') || 'XP change'
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function XPHistory({ transactions = [], isLoading = false, error = null }) {
  if (isLoading) {
    return <SkeletonList count={3} />
  }

  if (error) {
    return <p className="ds-body text-[color:var(--color-error-600)]">{error}</p>
  }

  if (!transactions.length) {
    return (
      <div className="rounded-[var(--radius-md)] bg-[color:var(--color-bg-canvas)] border border-[color:var(--color-border-soft)] px-5 py-8 text-center">
        <p className="ds-body">No XP transactions yet. Complete a task to earn your first XP.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {transactions.map((tx) => {
        const positive = tx.amount > 0
        return (
          <div
            key={tx.id}
            className="ds-card-lift flex items-center justify-between border border-[color:var(--color-border-soft)] rounded-[var(--radius-md)] px-4 py-3 bg-[color:var(--color-card-surface)]"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[length:var(--text-body)] font-medium text-[color:var(--color-gray-800)]">{formatReason(tx.reason)}</span>
              <span className="ds-caption">{formatDate(tx.createdAt)}</span>
            </div>
            <span
              className={`text-[length:var(--text-body-lg)] font-semibold ${
                positive ? 'text-[color:var(--color-success-500)]' : 'text-[color:var(--color-error-500)]'
              }`}
            >
              {positive ? '+' : ''}{tx.amount} XP
            </span>
          </div>
        )
      })}
    </div>
  )
}
