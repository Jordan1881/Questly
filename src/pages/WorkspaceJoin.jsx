import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import AuthLayout, { authInputClass } from '../components/layout/AuthLayout'
import FormButton from '../design-system/components/FormButton'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useAuthStore } from '../stores/authStore'
import { roleHomePath } from '../lib/workspaceNav'

const codeInputClass = `${authInputClass} uppercase tracking-widest text-center`

export default function WorkspaceJoin() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const memberships = useAuthStore((s) => s.memberships)
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId)
  const {
    lookupByCode,
    submitJoinRequest,
    fetchMyJoinRequest,
    joinRequest,
    isLoading,
    error,
    clearError,
  } = useWorkspaceStore()
  const [code, setCode] = useState('')
  const [targetWorkspace, setTargetWorkspace] = useState(null)

  const goDeveloperHome = (workspaceId) => {
    const id = workspaceId || activeWorkspaceId || user?.workspace_id
    navigate(roleHomePath('developer', Array.isArray(memberships) ? id : null), { replace: true })
  }

  useEffect(() => {
    fetchMyJoinRequest().catch(() => {})
    // Flag-off legacy: developers with a workspace skip join.
    // Flag-on: allow joining additional workspaces from the switcher.
    if (!Array.isArray(memberships) && user?.workspace_id) {
      goDeveloperHome(user.workspace_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.workspace_id, memberships, navigate, fetchMyJoinRequest])

  const handleLookup = async (e) => {
    e.preventDefault()
    clearError()
    const workspace = await lookupByCode(code)
    setTargetWorkspace(workspace)
  }

  const handleSubmit = async () => {
    if (!targetWorkspace) return
    await submitJoinRequest(targetWorkspace.id)
    setTargetWorkspace(null)
    setCode('')
  }

  if (joinRequest) {
    return (
      <AuthLayout centered>
        <div className="ds-card ds-card-pad w-full max-w-[520px] flex flex-col gap-4 text-center shadow-[var(--shadow-lg)]">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto ds-brand-gradient text-white text-[length:var(--text-h4)] font-bold"
            aria-hidden
          >
            …
          </div>
          <h1 className="ds-page-title">Join Request Pending</h1>
          <p className="ds-body">
            Your request to join the workspace is waiting for admin approval. You will get access once approved.
          </p>
          <p className="ds-body-sm">
            After approval, connect your Jira account on Profile to receive assigned tasks
            {joinRequest?.team_jira_site_host ? (
              <>
                {' '}
                from <strong>{joinRequest.team_jira_site_host}</strong>
              </>
            ) : (
              " from your team's Jira site"
            )}
            .
          </p>
          <FormButton type="button" className="w-full mt-4" onClick={async () => {
            const refreshed = await fetchMe()
            const state = useAuthStore.getState()
            if (Array.isArray(state.memberships) && state.activeWorkspaceId) {
              goDeveloperHome(state.activeWorkspaceId)
            } else if (refreshed?.workspace_id) {
              goDeveloperHome(refreshed.workspace_id)
            }
          }}>
            Check Status
          </FormButton>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout centered>
      <div className="ds-card ds-card-pad w-full max-w-[520px] flex flex-col gap-8 shadow-[var(--shadow-lg)]">
        <div>
          <h1 className="text-[32px] font-medium text-[color:var(--color-gray-900)]">Join a Workspace</h1>
          <p className="ds-body mt-2">Enter the workspace code shared by your admin.</p>
        </div>

        {error && (
          <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        {!targetWorkspace ? (
          <form onSubmit={handleLookup} className="flex flex-col gap-6">
            <input
              type="text"
              placeholder="WORKSPACE CODE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={codeInputClass}
              maxLength={12}
            />
            <FormButton type="submit" className="w-full" disabled={isLoading || !code.trim()}>
              {isLoading ? 'Looking up…' : 'Find Workspace'}
            </FormButton>
          </form>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="rounded-[12px] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border)] px-5 py-4">
              <p className="ds-body-sm">You are requesting to join</p>
              <p className="text-[20px] font-semibold text-[color:var(--color-gray-800)]">{targetWorkspace.name}</p>
              <p className="text-[13px] text-[color:var(--color-brand)] font-medium mt-1">Code: {targetWorkspace.code}</p>
              {targetWorkspace.team_jira_site_host ? (
                <p className="ds-body-sm mt-2">
                  Team Jira site: <strong>{targetWorkspace.team_jira_site_host}</strong>
                </p>
              ) : (
                <p className="ds-body-sm mt-2">
                  Team Jira is not connected yet — your admin will set it up before you can sync tasks.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <FormButton type="button" className="flex-1" onClick={() => setTargetWorkspace(null)}>Back</FormButton>
              <FormButton type="button" className="flex-1" disabled={isLoading} onClick={handleSubmit}>
                {isLoading ? 'Submitting…' : 'Submit Request'}
              </FormButton>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
