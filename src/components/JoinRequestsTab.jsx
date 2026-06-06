import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'

const CARD = 'bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]'

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

export default function JoinRequestsTab() {
  const {
    workspace,
    pendingJoinRequests,
    fetchMine,
    fetchPendingJoinRequests,
    fetchMembers,
    reviewJoinRequest,
    error,
  } = useWorkspaceStore()
  const [rowStatus, setRowStatus] = useState({})

  useEffect(() => {
    fetchMine()
      .then((ws) => fetchPendingJoinRequests(ws.id))
      .catch(() => {})
  }, [fetchMine, fetchPendingJoinRequests])

  const handle = async (request, status) => {
    if (!workspace) return
    setRowStatus((s) => ({ ...s, [request.id]: status }))
    setTimeout(async () => {
      await reviewJoinRequest(workspace.id, request.id, status)
      if (status === 'approved') {
        await fetchMembers(workspace.id).catch(() => {})
      }
      setRowStatus((s) => {
        const next = { ...s }
        delete next[request.id]
        return next
      })
    }, 800)
  }

  const TH = 'text-[12px] font-semibold text-[#6b7280] uppercase tracking-wide text-left py-3 px-4'
  const TD = 'py-3.5 px-4 text-[13px] text-[#374151]'

  return (
    <div>
      <div className="mb-6">
        <p className="text-[14px] font-semibold text-[#1f2937]">Join Requests</p>
        <p className="text-[13px] text-[#6b7280] mt-0.5">
          {pendingJoinRequests.length} request{pendingJoinRequests.length !== 1 ? 's' : ''} awaiting review
        </p>
        {error && <p className="text-[13px] text-red-600 mt-2">{error}</p>}
      </div>

      {pendingJoinRequests.length === 0 ? (
        <div className={`${CARD} p-12 flex flex-col items-center gap-3 text-center`}>
          <div className="w-12 h-12 rounded-full bg-[#d1fae5] flex items-center justify-center text-[#059669]">
            <CheckIcon />
          </div>
          <p className="text-[15px] font-semibold text-[#1f2937]">All caught up!</p>
          <p className="text-[13px] text-[#9ca3af]">No pending join requests right now.</p>
        </div>
      ) : (
        <div className={`${CARD} overflow-hidden`}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#f3f4f6]">
                <th className={TH}>Developer</th>
                <th className={TH}>Email</th>
                <th className={TH}>Requested</th>
                <th className={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingJoinRequests.map((request) => {
                const status = rowStatus[request.id]
                const rowBg = status === 'approved'
                  ? 'bg-[#f0fdf4]'
                  : status === 'rejected'
                  ? 'bg-[#fff5f5]'
                  : 'hover:bg-[#fafafa]'
                return (
                  <tr key={request.id} className={`border-b border-[#f9fafb] transition-colors ${rowBg}`}>
                    <td className={`${TD} font-medium text-[#1f2937]`}>{request.username}</td>
                    <td className={TD}>{request.email}</td>
                    <td className={TD}>{new Date(request.created_at).toLocaleDateString()}</td>
                    <td className={TD}>
                      {status ? (
                        <span className={`text-[12px] font-semibold ${status === 'approved' ? 'text-[#059669]' : 'text-[#ef4444]'}`}>
                          {status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handle(request, 'approved')}
                            className="flex items-center gap-1 px-3 py-1 rounded-[6px] text-[12px] font-semibold bg-[#d1fae5] text-[#059669] cursor-pointer hover:bg-[#a7f3d0] transition-colors"
                          >
                            <CheckIcon />
                            Approve
                          </button>
                          <button
                            onClick={() => handle(request, 'rejected')}
                            className="flex items-center gap-1 px-3 py-1 rounded-[6px] text-[12px] font-semibold bg-[#fee2e2] text-[#ef4444] cursor-pointer hover:bg-[#fecaca] transition-colors"
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
