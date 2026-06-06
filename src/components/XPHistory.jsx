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
    return <p className="text-[14px] text-red-600">{error}</p>
  }

  if (!transactions.length) {
    return (
      <div className="rounded-[8px] bg-[#f9fafb] border border-[#e5e7eb] px-5 py-8 text-center">
        <p className="text-[14px] text-[#6b7280]">No XP transactions yet. Complete a task to earn your first XP.</p>
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
            className="flex items-center justify-between border border-[#e5e7eb] rounded-[8px] px-4 py-3 bg-white"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-medium text-[#1f2937]">{formatReason(tx.reason)}</span>
              <span className="text-[12px] text-[#9ca3af]">{formatDate(tx.createdAt)}</span>
            </div>
            <span
              className="text-[16px] font-semibold"
              style={{ color: positive ? '#10b981' : '#ef4444' }}
            >
              {positive ? '+' : ''}{tx.amount} XP
            </span>
          </div>
        )
      })}
    </div>
  )
}
