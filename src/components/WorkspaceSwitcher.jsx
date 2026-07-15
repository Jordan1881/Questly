import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../stores/authStore'
import { jiraIdentityCue, sortMemberships } from '../lib/workspaceNav'

function RoleChip({ role }) {
  const label = role === 'admin' ? 'Admin' : 'Developer'
  return (
    <span className="inline-flex items-center rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide bg-[color:var(--color-bg-subtle)] text-[color:var(--color-gray-700)]">
      {label}
    </span>
  )
}

function OwnerBadge() {
  return (
    <span className="inline-flex items-center rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide bg-[color:var(--color-bg-brand-subtle)] text-[color:var(--color-brand)]">
      Owner
    </span>
  )
}

function MembershipRow({ membership, active, onSelect }) {
  const name = membership.workspace?.name || 'Workspace'
  const jiraCue = jiraIdentityCue(membership.workspace)

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={() => onSelect(membership)}
      className={`ds-focus-ring w-full text-left px-3 py-2.5 rounded-[var(--radius-md)] flex flex-col gap-1 transition-colors ${
        active
          ? 'bg-[color:var(--color-bg-brand-subtle)]'
          : 'hover:bg-[color:var(--color-bg-subtle)]'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-semibold text-[color:var(--color-gray-900)] truncate">{name}</span>
        {active && (
          <span className="text-[color:var(--color-brand)] text-sm shrink-0" aria-hidden>
            ✓
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <RoleChip role={membership.role} />
        {membership.is_owner ? <OwnerBadge /> : null}
        <span className="text-[12px] text-[color:var(--color-text-muted)] truncate">{jiraCue}</span>
      </div>
    </button>
  )
}

export default function WorkspaceSwitcher() {
  const navigate = useNavigate()
  const menuId = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)

  const memberships = useAuthStore((s) => s.memberships)
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId)
  const setActiveWorkspace = useAuthStore((s) => s.setActiveWorkspace)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  const multi = Array.isArray(memberships)
  const sorted = sortMemberships(memberships || [])
  const active = sorted.find((m) => m.workspace_id === activeWorkspaceId) || sorted[0] || null

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!multi) return null

  const triggerName = active?.workspace?.name || 'No workspace'
  const triggerRole = active?.role || 'developer'
  const triggerJira = active ? jiraIdentityCue(active.workspace) : 'Not connected'

  const handleSelect = async (membership) => {
    setOpen(false)
    if (membership.workspace_id === activeWorkspaceId) return
    const path = setActiveWorkspace(membership.workspace_id)
    // Refresh balances/membership list for the newly active workspace (X-Workspace-Id).
    await fetchMe().catch(() => {})
    if (path) navigate(path)
  }

  return (
    <div ref={rootRef} className="relative shrink-0 min-w-0 max-w-[min(280px,40vw)]">
      <button
        type="button"
        className="ds-focus-ring flex items-center gap-2 min-w-0 max-w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2.5 py-1.5 hover:bg-[color:var(--color-bg-subtle)] transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="min-w-0 flex flex-col items-start text-left">
          <span className="text-[13px] font-semibold text-[color:var(--color-gray-900)] truncate max-w-[160px] sm:max-w-[200px]">
            {triggerName}
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-[color:var(--color-text-muted)]">
            <span className="truncate">{triggerRole === 'admin' ? 'Admin' : 'Developer'}</span>
            {active?.is_owner ? <span>· Owner</span> : null}
            <span className="hidden md:inline truncate">· {triggerJira}</span>
          </span>
        </span>
        <span className="text-[color:var(--color-text-muted)] text-xs shrink-0" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          id={menuId}
          role="listbox"
          aria-label="Workspaces"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-[min(320px,92vw)] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] shadow-[var(--shadow-lg)] p-2 flex flex-col gap-1"
        >
          {sorted.length === 0 ? (
            <p className="px-3 py-2 text-[13px] text-[color:var(--color-text-muted)]">
              You are not in a workspace yet.
            </p>
          ) : (
            sorted.map((membership) => (
              <MembershipRow
                key={membership.workspace_id}
                membership={membership}
                active={membership.workspace_id === activeWorkspaceId}
                onSelect={handleSelect}
              />
            ))
          )}

          <div className="border-t border-[color:var(--color-border)] mt-1 pt-1 flex flex-col gap-0.5">
            <button
              type="button"
              className="ds-focus-ring w-full text-left px-3 py-2 rounded-[var(--radius-md)] text-[13px] font-medium text-[color:var(--color-gray-800)] hover:bg-[color:var(--color-bg-subtle)]"
              onClick={() => {
                setOpen(false)
                navigate('/workspace/create')
              }}
            >
              Create workspace
            </button>
            <button
              type="button"
              className="ds-focus-ring w-full text-left px-3 py-2 rounded-[var(--radius-md)] text-[13px] font-medium text-[color:var(--color-gray-800)] hover:bg-[color:var(--color-bg-subtle)]"
              onClick={() => {
                setOpen(false)
                navigate('/workspace/join')
              }}
            >
              Join workspace
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { jiraIdentityCue, RoleChip, OwnerBadge }
