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
  'h-10 px-4 ds-focus-ring rounded-[var(--radius-md)] ds-body-sm font-semibold border border-[color:var(--color-border-soft)] bg-[color:var(--color-card-surface)] text-[color:var(--color-gray-800)] hover:bg-[color:var(--color-bg-canvas)]'

function workspaceIntroText({ isAdminShell, hasAnyMembership }) {
  if (isAdminShell) return 'Switch teams here, create another workspace, or join one with a code.'
  if (hasAnyMembership) return 'Switch between your teams here, or join another workspace with a code.'
  return 'Create a workspace for your team, or join one with a code from your admin.'
}

function roleLabel(membership) {
  const role = membership.role === 'admin' ? 'Admin' : 'Developer'
  return membership.is_owner ? `${role} · Owner` : role
}

function CurrentWorkspaceSection({ isAdminShell, workspace, active, canCreate }) {
  if (isAdminShell && workspace?.code) {
    return (
      <section className="mb-10">
        <h2 className="ds-subsection-title mb-3">Current workspace</h2>
        <WorkspaceInviteCode code={workspace.code} workspaceName={workspace.name} />
        <p className="ds-body-sm mt-3 text-[color:var(--color-text-muted)]">
          Linked Jira: {jiraIdentityCue(workspace)}
        </p>
      </section>
    )
  }

  if (active?.workspace) {
    return (
      <section className="mb-10">
        <h2 className="ds-subsection-title mb-3">Current workspace</h2>
        <div className="ds-card ds-card-pad flex flex-col gap-2">
          <p className="text-[18px] font-semibold text-[color:var(--color-gray-900)]">
            {active.workspace.name || 'Workspace'}
          </p>
          <p className="ds-body-sm text-[color:var(--color-text-muted)]">
            Your role: {roleLabel(active)}
            {' · '}
            Jira: {jiraIdentityCue(active.workspace)}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-10 rounded-[var(--radius-lg)] border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-canvas)] px-5 py-4 shadow-[var(--shadow-soft-sm)]">
      <p className="ds-body-sm">
        You are not in a workspace yet.
        {canCreate
          ? ' Create one below or join with a code from your admin.'
          : ' Join with a code from your admin.'}
      </p>
    </section>
  )
}

function MembershipSwitchList({ memberships, activeWorkspaceId, onSwitch }) {
  if (memberships.length === 0) return null

  return (
    <section className="mb-10">
      <h2 className="ds-subsection-title mb-3">Your workspaces</h2>
      <p className="ds-body-sm mb-3 text-[color:var(--color-text-muted)]">
        Choose a team to make it active.
      </p>
      <ul className="flex flex-col gap-2" data-testid="workspace-switch-list">
        {memberships.map((m) => {
          const isCurrent = m.workspace_id === activeWorkspaceId
          return (
            <li key={m.workspace_id}>
              <button
                type="button"
                aria-current={isCurrent ? 'true' : undefined}
                disabled={isCurrent}
                className={`${ghostBtn} w-full max-w-[480px] text-left flex flex-col items-start gap-0.5 !h-auto py-3 ${
                  isCurrent
                    ? 'border-[color:var(--color-brand)] bg-[color:var(--color-bg-brand-subtle)] disabled:opacity-100'
                    : ''
                }`}
                onClick={() => onSwitch(m.workspace_id)}
              >
                <span className="font-semibold flex items-center gap-2">
                  {m.workspace?.name || 'Workspace'}
                  {isCurrent && (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-brand)]">
                      Current
                    </span>
                  )}
                </span>
                <span className="text-[12px] text-[color:var(--color-text-muted)]">
                  {roleLabel(m)}
                  {' · '}
                  {jiraIdentityCue(m.workspace)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function CreateWorkspaceSection({
  hasAnyMembership,
  created,
  createName,
  setCreateName,
  setCreated,
  isLoading,
  onCreate,
  onActivate,
}) {
  return (
    <section className="mb-10">
      <h2 className="ds-subsection-title mb-1">
        {hasAnyMembership ? 'Create another workspace' : 'Create workspace'}
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
            <button type="button" className={primaryBtn} onClick={() => onActivate(created.id)}>
              Open as admin
            </button>
            <button type="button" className={ghostBtn} onClick={() => setCreated(null)}>
              Create another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onCreate} className="flex flex-col gap-4 max-w-[480px]">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="workspace-create-name"
              className="text-[14px] font-medium text-[color:var(--color-gray-900)]"
            >
              Workspace name
            </label>
            <input
              id="workspace-create-name"
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
  )
}

function JoinPendingCard({ joinRequest, onCheckStatus }) {
  const workspaceName = joinRequest.workspace?.name || joinRequest.workspace_name
  return (
    <div className="ds-card ds-card-pad flex flex-col gap-3 max-w-[480px]">
      <p className="ds-body font-semibold">Join request pending</p>
      <p className="ds-body-sm text-[color:var(--color-text-muted)]">
        Waiting for an admin to approve your request
        {workspaceName ? (
          <>
            {' '}
            for <strong>{workspaceName}</strong>
          </>
        ) : null}
        .
      </p>
      <button type="button" className={primaryBtn} onClick={onCheckStatus}>
        Check status
      </button>
    </div>
  )
}

function JoinLookupForm({ joinCode, setJoinCode, isLoading, onLookup }) {
  return (
    <form onSubmit={onLookup} className="flex flex-col gap-4 max-w-[480px]">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="workspace-join-code"
          className="text-[14px] font-medium text-[color:var(--color-gray-900)]"
        >
          Workspace code
        </label>
        <input
          id="workspace-join-code"
          type="text"
          placeholder="WORKSPACE CODE"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          className={codeInputClass}
          maxLength={12}
        />
      </div>
      <button type="submit" className={primaryBtn} disabled={isLoading || !joinCode.trim()}>
        {isLoading ? 'Looking up…' : 'Find workspace'}
      </button>
    </form>
  )
}

function JoinConfirmCard({ joinTarget, isLoading, onBack, onSubmit }) {
  return (
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
        <button type="button" className={`${ghostBtn} flex-1`} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className={`${primaryBtn} flex-1`}
          disabled={isLoading}
          onClick={onSubmit}
        >
          {isLoading ? 'Submitting…' : 'Submit request'}
        </button>
      </div>
    </div>
  )
}

function JoinWorkspaceSection({
  active,
  workspace,
  joinRequest,
  joinTarget,
  joinCode,
  setJoinCode,
  setJoinTarget,
  isLoading,
  onLookup,
  onSubmit,
  onCheckStatus,
}) {
  let body
  if (joinRequest) {
    body = <JoinPendingCard joinRequest={joinRequest} onCheckStatus={onCheckStatus} />
  } else if (!joinTarget) {
    body = (
      <JoinLookupForm
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        isLoading={isLoading}
        onLookup={onLookup}
      />
    )
  } else {
    body = (
      <JoinConfirmCard
        joinTarget={joinTarget}
        isLoading={isLoading}
        onBack={() => setJoinTarget(null)}
        onSubmit={onSubmit}
      />
    )
  }

  return (
    <section className="mb-6">
      <h2 className="ds-subsection-title mb-1">
        {active || workspace?.id ? 'Join another workspace' : 'Join a workspace'}
      </h2>
      <p className="ds-body-sm mb-4 text-[color:var(--color-text-muted)]">
        Enter a code from a team admin to request developer access.
      </p>
      {body}
    </section>
  )
}

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
    clearError()
    if (isAdminShell) {
      fetchMine().catch(() => {})
    } else {
      // Developer-only endpoint — calling it as admin yields 403 "Forbidden".
      fetchMyJoinRequest().catch(() => {})
    }
  }, [fetchMine, fetchMyJoinRequest, isAdminShell, clearError])

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
  const allMemberships = sortMemberships(memberships || [])
  const hasAnyMembership = multi
    ? allMemberships.length > 0
    : Boolean(activeWorkspaceId || workspace?.id)
  // Admins (and users with no membership yet) can create. Developers only join.
  const canCreate = isAdminShell || !hasAnyMembership
  const showJoin = multi || !hasAnyMembership

  const switchTo = async (workspaceId) => {
    if (!workspaceId || workspaceId === activeWorkspaceId) return
    const path = setActiveWorkspace(workspaceId)
    await fetchMe().catch(() => {})
    if (path) navigate(path)
  }

  const handleCheckJoinStatus = async () => {
    await fetchMe()
    await fetchMyJoinRequest().catch(() => {})
  }

  return (
    <div className="ds-page">
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      <PageHeader onOpenSidebar={() => setShowSidebar(true)} />

      <main className="ds-page-main max-w-[720px]">
        <h1 className="ds-page-title mb-2">Workspace</h1>
        <p className="ds-body-sm mb-8 text-[color:var(--color-text-muted)]">
          {workspaceIntroText({ isAdminShell, hasAnyMembership })}
        </p>

        {error && (
          <div className="mb-6 rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <CurrentWorkspaceSection
          isAdminShell={isAdminShell}
          workspace={workspace}
          active={active}
          canCreate={canCreate}
        />

        {multi && (
          <MembershipSwitchList
            memberships={allMemberships}
            activeWorkspaceId={activeWorkspaceId}
            onSwitch={switchTo}
          />
        )}

        {canCreate && (
          <CreateWorkspaceSection
            hasAnyMembership={hasAnyMembership}
            created={created}
            createName={createName}
            setCreateName={setCreateName}
            setCreated={setCreated}
            isLoading={isLoading}
            onCreate={handleCreate}
            onActivate={activateCreated}
          />
        )}

        {showJoin && (
          <JoinWorkspaceSection
            active={active}
            workspace={workspace}
            joinRequest={joinRequest}
            joinTarget={joinTarget}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            setJoinTarget={setJoinTarget}
            isLoading={isLoading}
            onLookup={handleJoinLookup}
            onSubmit={handleJoinSubmit}
            onCheckStatus={handleCheckJoinStatus}
          />
        )}

      </main>
    </div>
  )
}
