import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import WorkspaceInviteCode from '../components/WorkspaceInviteCode'
import { authInputClass } from '../components/layout/AuthLayout'
import { useAuthStore } from '../stores/authStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { getShellRole, jiraIdentityCue, roleHomePath, sortMemberships } from '../lib/workspaceNav'

const codeInputClass = `${authInputClass} uppercase tracking-widest text-center`
const primaryBtn =
  'h-10 px-4 ds-btn-primary ds-focus-ring rounded-[var(--radius-md)] ds-body-sm font-semibold disabled:opacity-55 disabled:cursor-not-allowed'
const ghostBtn =
  'h-10 px-4 ds-focus-ring rounded-[var(--radius-md)] ds-body-sm font-semibold border border-[color:var(--color-border)] bg-[color:var(--color-bg)] text-[color:var(--color-gray-800)] hover:bg-[color:var(--color-bg-subtle)]'

export default function Workspace() {
  const navigate = useNavigate()
  const memberships = useAuthStore((s) => s.memberships)
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId)
  const activeMembership = useAuthStore((s) => s.activeMembership)
  const userRole = useAuthStore((s) => s.userRole)
  const setActiveWorkspace = useAuthStore((s) => s.setActiveWorkspace)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const multi = Array.isArray(memberships)
  const shellRole = getShellRole({ memberships, activeMembership, userRole })
  const isAdminShell = shellRole === 'admin'

  const {
    workspace,
    fetchMine,
    createWorkspace,
    lookupByCode,
    submitJoinRequest,
    fetchMyJoinRequest,
    joinRequest,
    isLoading,
    error,
    clearError,
  } = useWorkspaceStore()

  const [showSidebar, setShowSidebar] = useState(false)
  const [createName, setCreateName] = useState('')
  const [created, setCreated] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinTarget, setJoinTarget] = useState(null)

  useEffect(() => {
    if (isAdminShell) fetchMine().catch(() => {})
    fetchMyJoinRequest().catch(() => {})
  }, [fetchMine, fetchMyJoinRequest, isAdminShell])

  const activateCreated = async (workspaceId) => {
    if (!workspaceId) return
    if (multi) {
      setActiveWorkspace(workspaceId)
      await fetchMe().catch(() => {})
    }
    navigate(roleHomePath('admin', multi ? workspaceId : null), { replace: true })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    clearError()
    if (!createName.trim()) return
    try {
      const ws = await createWorkspace(createName.trim())
      setCreated(ws)
      setCreateName('')
    } catch {
      // store surfaces error
    }
  }

  const handleJoinLookup = async (e) => {
    e.preventDefault()
    clearError()
    const ws = await lookupByCode(joinCode)
    setJoinTarget(ws)
  }

  const handleJoinSubmit = async () => {
    if (!joinTarget) return
    await submitJoinRequest(joinTarget.id)
    setJoinTarget(null)
    setJoinCode('')
  }

  const active = activeMembership
    || (memberships || []).find((m) => m.workspace_id === activeWorkspaceId)
    || null
  const otherMemberships = sortMemberships(memberships || []).filter(
    (m) => m.workspace_id !== active?.workspace_id,
  )
  const showJoin = multi || !activeWorkspaceId

  return (
    <div className="ds-page">
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      <PageHeader onOpenSidebar={() => setShowSidebar(true)} />

      <main className="ds-page-main max-w-[720px]">
        <h1 className="ds-page-title mb-2">Workspace</h1>
        <p className="ds-body-sm mb-8 text-[color:var(--color-text-muted)]">
          {multi
            ? 'See your teams, create a new workspace, or join another with a code.'
            : 'Create or join a workspace to get started.'}
        </p>

        {error && (
          <div className="mb-6 rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        {isAdminShell && workspace?.code ? (
          <section className="mb-10">
            <h2 className="ds-subsection-title mb-3">Current workspace</h2>
            <WorkspaceInviteCode code={workspace.code} workspaceName={workspace.name} />
            <p className="ds-body-sm mt-3 text-[color:var(--color-text-muted)]">
              Linked Jira: {jiraIdentityCue(workspace)}
            </p>
          </section>
        ) : active?.workspace ? (
          <section className="mb-10">
            <h2 className="ds-subsection-title mb-3">Current workspace</h2>
            <div className="ds-card ds-card-pad flex flex-col gap-2">
              <p className="text-[18px] font-semibold text-[color:var(--color-gray-900)]">
                {active.workspace.name || 'Workspace'}
              </p>
              <p className="ds-body-sm text-[color:var(--color-text-muted)]">
                Your role: {active.role === 'admin' ? 'Admin' : 'Developer'}
                {active.is_owner ? ' · Owner' : ''}
                {' · '}
                Jira: {jiraIdentityCue(active.workspace)}
              </p>
            </div>
          </section>
        ) : (
          <section className="mb-10 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-subtle)] px-5 py-4">
            <p className="ds-body-sm">
              You are not in a workspace yet. Create one below or join with a code from your admin.
            </p>
          </section>
        )}

        {multi && otherMemberships.length > 0 && (
          <section className="mb-10">
            <h2 className="ds-subsection-title mb-3">Your other workspaces</h2>
            <ul className="flex flex-col gap-2">
              {otherMemberships.map((m) => (
                <li key={m.workspace_id}>
                  <button
                    type="button"
                    className={`${ghostBtn} w-full max-w-[480px] text-left flex flex-col items-start gap-0.5 !h-auto py-3`}
                    onClick={async () => {
                      const path = setActiveWorkspace(m.workspace_id)
                      await fetchMe().catch(() => {})
                      if (path) navigate(path)
                    }}
                  >
                    <span className="font-semibold">{m.workspace?.name || 'Workspace'}</span>
                    <span className="text-[12px] text-[color:var(--color-text-muted)]">
                      {m.role === 'admin' ? 'Admin' : 'Developer'}
                      {m.is_owner ? ' · Owner' : ''}
                      {' · '}
                      {jiraIdentityCue(m.workspace)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-10">
          <h2 className="ds-subsection-title mb-1">
            {active || workspace?.id ? 'Create another workspace' : 'Create workspace'}
          </h2>
          <p className="ds-body-sm mb-4 text-[color:var(--color-text-muted)]">
            Become the owner/admin of a new team with its own invite code and Jira link.
          </p>

          {created ? (
            <div className="ds-card ds-card-pad flex flex-col gap-4">
              <p className="ds-body">
                <strong>{created.name}</strong> is ready. Share this code with developers:
              </p>
              <WorkspaceInviteCode code={created.code} workspaceName={created.name} />
              <div className="flex flex-wrap gap-3">
                <button type="button" className={primaryBtn} onClick={() => activateCreated(created.id)}>
                  Open as admin
                </button>
                <button type="button" className={ghostBtn} onClick={() => setCreated(null)}>
                  Create another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="flex flex-col gap-4 max-w-[480px]">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-[color:var(--color-gray-900)]">
                  Workspace name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Engineering"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className={authInputClass}
                />
              </div>
              <button type="submit" className={primaryBtn} disabled={isLoading || !createName.trim()}>
                {isLoading ? 'Creating…' : 'Create workspace'}
              </button>
            </form>
          )}
        </section>

        {showJoin && (
          <section className="mb-6">
            <h2 className="ds-subsection-title mb-1">
              {active || workspace?.id ? 'Join another workspace' : 'Join a workspace'}
            </h2>
            <p className="ds-body-sm mb-4 text-[color:var(--color-text-muted)]">
              Enter a code from a team admin to request developer access.
            </p>

            {joinRequest ? (
              <div className="ds-card ds-card-pad flex flex-col gap-3 max-w-[480px]">
                <p className="ds-body font-semibold">Join request pending</p>
                <p className="ds-body-sm text-[color:var(--color-text-muted)]">
                  Waiting for an admin to approve your request
                  {joinRequest.workspace?.name || joinRequest.workspace_name ? (
                    <>
                      {' '}
                      for <strong>{joinRequest.workspace?.name || joinRequest.workspace_name}</strong>
                    </>
                  ) : null}
                  .
                </p>
                <button
                  type="button"
                  className={primaryBtn}
                  onClick={async () => {
                    await fetchMe()
                    await fetchMyJoinRequest().catch(() => {})
                  }}
                >
                  Check status
                </button>
              </div>
            ) : !joinTarget ? (
              <form onSubmit={handleJoinLookup} className="flex flex-col gap-4 max-w-[480px]">
                <input
                  type="text"
                  placeholder="WORKSPACE CODE"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className={codeInputClass}
                  maxLength={12}
                />
                <button type="submit" className={primaryBtn} disabled={isLoading || !joinCode.trim()}>
                  {isLoading ? 'Looking up…' : 'Find workspace'}
                </button>
              </form>
            ) : (
              <div className="ds-card ds-card-pad flex flex-col gap-4 max-w-[480px]">
                <div>
                  <p className="ds-body-sm">You are requesting to join</p>
                  <p className="text-[20px] font-semibold text-[color:var(--color-gray-800)]">
                    {joinTarget.name}
                  </p>
                  <p className="text-[13px] text-[color:var(--color-brand)] font-medium mt-1">
                    Code: {joinTarget.code}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button type="button" className={`${ghostBtn} flex-1`} onClick={() => setJoinTarget(null)}>
                    Back
                  </button>
                  <button
                    type="button"
                    className={`${primaryBtn} flex-1`}
                    disabled={isLoading}
                    onClick={handleJoinSubmit}
                  >
                    {isLoading ? 'Submitting…' : 'Submit request'}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {multi && activeWorkspaceId && (
          <p className="ds-body-sm text-[color:var(--color-text-muted)]">
            Tip: use the workspace menu in the header to switch between teams you already belong to.
          </p>
        )}
      </main>
    </div>
  )
}
