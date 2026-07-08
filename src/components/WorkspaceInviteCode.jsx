import { useState } from 'react'

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
        <span className="ds-body-sm">Workspace code:</span>
        <span className="font-mono text-[length:var(--text-body-lg)] font-bold tracking-[0.15em] text-[color:var(--color-gray-800)]">{code}</span>
        <button
          type="button"
          onClick={copyCode}
          className="ds-body-sm font-semibold text-[color:var(--color-brand)] hover:underline cursor-pointer ds-focus-ring rounded-[var(--radius-sm)] px-1"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    )
  }

  return (
    <div
      className="ds-card ds-card-pad flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      data-testid="workspace-invite-code"
    >
      <div className="min-w-0">
        <p className="ds-subsection-title">Invite developers</p>
        <p className="ds-body-sm mt-0.5">
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
        <div className="rounded-[var(--radius-lg)] bg-[color:var(--color-bg-brand-subtle)] border border-[color:var(--color-primary-100)] px-5 py-3 text-center min-w-[160px]">
          <p className="ds-caption uppercase tracking-wide text-[color:var(--color-brand)] font-semibold mb-1">Workspace Code</p>
          <p className="font-mono text-[length:var(--text-h4)] font-bold tracking-[0.2em] text-[color:var(--color-gray-800)]">{code}</p>
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="h-10 px-4 ds-btn-primary ds-focus-ring rounded-[var(--radius-md)] ds-body-sm font-semibold"
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
    </div>
  )
}
