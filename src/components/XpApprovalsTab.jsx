import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'

const CheckIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 shrink-0">
    <path d="M2 7l3.5 3.5 6.5-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 shrink-0">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const TH = 'ds-caption font-semibold uppercase tracking-wide text-left py-3 px-4'
const TD = 'py-3.5 px-4 ds-body-sm text-[color:var(--color-gray-700)]'

export default function XpApprovalsTab() {
  const {
    workspace,
    pendingXpApprovals,
    fetchMine,
    fetchPendingXpApprovals,
    reviewXpApproval,
    error,
  } = useWorkspaceStore()
  const [rowStatus, setRowStatus] = useState({})

  useEffect(() => {
    fetchMine()
      .then((ws) => fetchPendingXpApprovals(ws.id))
      .catch(() => {})
  }, [fetchMine, fetchPendingXpApprovals])

  const handle = async (request, status) => {
    if (!workspace) return
    setRowStatus((s) => ({ ...s, [request.id]: status }))
    setTimeout(async () => {
      await reviewXpApproval(workspace.id, request.id, status)
      setRowStatus((s) => {
        const next = { ...s }
        delete next[request.id]
        return next
      })
    }, 800)
  }

  return (
    <div>
      <div className="mb-6">
        <p className="ds-subsection-title">XP Approvals</p>
        <p className="ds-body-sm mt-0.5">
          {pendingXpApprovals.length} completion{pendingXpApprovals.length !== 1 ? 's' : ''} awaiting XP approval
        </p>
        {error && <p className="ds-body-sm text-[color:var(--color-error-600)] mt-2">{error}</p>}
      </div>

      {pendingXpApprovals.length === 0 ? (
        <div className="ds-card ds-card-pad-lg py-12 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[color:var(--color-success-100)] flex items-center justify-center text-[color:var(--color-success-600)]">
            <CheckIcon />
          </div>
          <p className="ds-subsection-title font-semibold text-[color:var(--color-gray-800)]">All caught up!</p>
          <p className="ds-body-sm text-[color:var(--color-text-subtle)]">
            No task completions waiting for XP approval.
          </p>
        </div>
      ) : (
        <div className="ds-card overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[color:var(--color-bg-muted)]">
                <th className={TH}>Developer</th>
                <th className={TH}>Task</th>
                <th className={TH}>XP</th>
                <th className={TH}>Submitted</th>
                <th className={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingXpApprovals.map((request) => {
                const status = rowStatus[request.id]
                const rowBg = status === 'approved'
                  ? 'bg-[color:var(--color-success-50)]'
                  : status === 'rejected'
                  ? 'bg-[color:var(--color-error-50)]'
                  : 'hover:bg-[color:var(--color-bg-subtle)]'
                return (
                  <tr key={request.id} className={`border-b border-[color:var(--color-bg-subtle)] transition-colors ${rowBg}`}>
                    <td className={TD}>
                      <p className="font-medium text-[color:var(--color-gray-800)]">{request.username}</p>
                      <p className="ds-caption text-[color:var(--color-text-subtle)]">{request.email}</p>
                    </td>
                    <td className={TD}>
                      <p className="font-medium text-[color:var(--color-gray-800)]">{request.task_title}</p>
                      <p className="ds-caption text-[color:var(--color-text-subtle)]">{request.jira_issue_key}</p>
                    </td>
                    <td className={TD}>
                      <span className="font-semibold text-[color:var(--color-brand)]">+{request.xp_amount} XP</span>
                    </td>
                    <td className={TD}>{new Date(request.created_at).toLocaleDateString()}</td>
                    <td className={TD}>
                      {status ? (
                        <span className={`ds-caption font-semibold ${status === 'approved' ? 'text-[color:var(--color-success-600)]' : 'text-[color:var(--color-error-500)]'}`}>
                          {status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handle(request, 'approved')}
                            className="flex items-center gap-1 px-3 py-1 rounded-[var(--radius-md)] ds-caption font-semibold cursor-pointer transition-colors ds-focus-ring bg-[color:var(--color-success-100)] text-[color:var(--color-success-600)] hover:bg-[color:var(--color-success-200)]"
                          >
                            <CheckIcon />
                            Approve XP
                          </button>
                          <button
                            type="button"
                            onClick={() => handle(request, 'rejected')}
                            className="flex items-center gap-1 px-3 py-1 rounded-[var(--radius-md)] ds-caption font-semibold cursor-pointer transition-colors ds-focus-ring bg-[color:var(--color-error-100)] text-[color:var(--color-error-500)] hover:bg-[color:var(--color-error-200)]"
                          >
                            <XIcon />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
