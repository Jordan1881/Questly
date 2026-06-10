import { useState } from 'react'

const CARD = 'bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]'

export default function WorkspaceInviteCode({ code, workspaceName, compact = false }) {
  const [copied, setCopied] = useState(false)

  if (!code) return null

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be unavailable in some contexts
    }
  }

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[13px] text-[#6b7280]">Workspace code:</span>
        <span className="font-mono text-[15px] font-bold tracking-[0.15em] text-[#1f2937]">{code}</span>
        <button
          type="button"
          onClick={copyCode}
          className="text-[13px] font-semibold text-[#942fcd] hover:underline cursor-pointer"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    )
  }

  return (
    <div
      className={`${CARD} p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}
      data-testid="workspace-invite-code"
    >
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[#1f2937]">Invite developers</p>
        <p className="text-[13px] text-[#6b7280] mt-0.5">
          Share this code so developers can request to join
          {workspaceName ? (
            <>
              {' '}
              <strong>{workspaceName}</strong>
            </>
          ) : (
            ' your workspace'
          )}
          .
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="rounded-[10px] bg-[#f5eefd] border border-[#e9d5ff] px-5 py-3 text-center min-w-[160px]">
          <p className="text-[11px] uppercase tracking-wide text-[#942fcd] font-semibold mb-1">Workspace Code</p>
          <p className="font-mono text-[22px] font-bold tracking-[0.2em] text-[#1f2937]">{code}</p>
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="h-10 px-4 rounded-[8px] text-[13px] font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
    </div>
  )
}
