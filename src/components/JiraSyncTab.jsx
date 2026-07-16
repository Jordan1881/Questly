import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { jiraIdentityCue } from '../lib/workspaceNav'

const SyncIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
    <path
      d="M4 10a6 6 0 0110.24-4.24M16 10a6 6 0 01-10.24 4.24"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M14 3h2.5V5.5M6 17H3.5V14.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const INPUT_CLASS =
  'ds-input-field ds-focus-ring w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] text-[length:var(--text-body)] text-[color:var(--color-gray-800)] placeholder:text-[color:var(--color-text-subtle)] bg-[color:var(--color-bg)]'

function formatSyncTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function FieldLabel({ children }) {
  return <label className="ds-body-sm font-medium text-[color:var(--color-gray-700)]">{children}</label>
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={INPUT_CLASS}
    />
  )
}

export default function JiraSyncTab() {
  const navigate = useNavigate()
  const {
    workspace,
    fetchMine,
    connectJira,
    disconnectJira,
    syncJiraTasks,
    fetchWorkspaceJiraOAuthStatus,
    startWorkspaceJiraOAuth,
    fetchPendingJiraOAuth,
    fetchPendingJiraOAuthSites,
    confirmPendingJiraOAuthSite,
    fetchPendingJiraOAuthProjects,
    confirmPendingJiraOAuthProject,
    cancelPendingJiraOAuth,
    lastJiraSyncAt,
    lastJiraSyncResult,
    isLoading,
    error,
    clearError,
  } = useWorkspaceStore()
  const [toast, setToast] = useState(null)
  const [oauthAvailable, setOauthAvailable] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [siteUrl, setSiteUrl] = useState('')
  const [projectKey, setProjectKey] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [oauthPending, setOauthPending] = useState(null)
  const [pendingSites, setPendingSites] = useState([])
  const [selectedPendingSite, setSelectedPendingSite] = useState('')
  const [pendingProjects, setPendingProjects] = useState([])
  const [selectedPendingProject, setSelectedPendingProject] = useState('')
  const [pendingBusy, setPendingBusy] = useState(false)

  const loadPendingProjects = async (workspaceId) => {
    const { projects } = await fetchPendingJiraOAuthProjects(workspaceId)
    setPendingProjects(projects || [])
    if (projects?.length === 1) {
      setSelectedPendingProject(projects[0].key)
    }
  }

  const loadOauthPending = async (workspaceId) => {
    if (!workspaceId) {
      setOauthPending(null)
      setPendingSites([])
      setSelectedPendingSite('')
      setPendingProjects([])
      setSelectedPendingProject('')
      return
    }
    try {
      const pending = await fetchPendingJiraOAuth(workspaceId)
      setOauthPending(pending)
      if (!pending) {
        setPendingSites([])
        setSelectedPendingSite('')
        setPendingProjects([])
        setSelectedPendingProject('')
        return
      }
      if (pending.selected_site_url) {
        setSelectedPendingSite(pending.selected_site_url)
        setPendingSites([])
        try {
          await loadPendingProjects(workspaceId)
        } catch (err) {
          setPendingProjects([])
          setToast({
            type: 'error',
            message: err.message || 'Could not load Jira projects for the selected site.',
          })
        }
        return
      }
      try {
        const { sites } = await fetchPendingJiraOAuthSites(workspaceId)
        setPendingSites(sites || [])
        setPendingProjects([])
        if (sites?.length === 1) {
          setSelectedPendingSite(sites[0].url)
        }
      } catch (err) {
        setPendingSites([])
        setOauthPending(null)
        setToast({
          type: 'error',
          message: err.message || 'No Atlassian sites found. Use Advanced API token connect.',
        })
        setShowManual(true)
      }
    } catch {
      setOauthPending(null)
      setPendingSites([])
      setPendingProjects([])
    }
  }

  useEffect(() => {
    fetchMine().catch(() => {})
    fetchWorkspaceJiraOAuthStatus().then((status) => {
      setOauthAvailable(Boolean(status.available))
      if (!status.available) setShowManual(true)
    })
  }, [fetchMine, fetchWorkspaceJiraOAuthStatus])

  useEffect(() => {
    if (!workspace) return
    setSiteUrl(workspace.jira_site_url || '')
    setProjectKey(workspace.jira_project_key || '')
    setAccessToken('')
    loadOauthPending(workspace.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when workspace identity changes
  }, [workspace?.id])

  const handleConfirmPendingSite = async () => {
    if (!workspace?.id || !selectedPendingSite) return
    setPendingBusy(true)
    clearError()
    setToast(null)
    try {
      const result = await confirmPendingJiraOAuthSite(workspace.id, selectedPendingSite)
      setOauthPending(result)
      setPendingSites([])
      await loadPendingProjects(workspace.id)
      setToast({
        type: 'success',
        message: `Site confirmed: ${result.selected_site_url}. Choose a project to finish.`,
      })
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to confirm Jira site.' })
    } finally {
      setPendingBusy(false)
    }
  }

  const handleConfirmPendingProject = async () => {
    if (!workspace?.id || !selectedPendingProject) return
    setPendingBusy(true)
    clearError()
    setToast(null)
    try {
      const result = await confirmPendingJiraOAuthProject(workspace.id, selectedPendingProject)
      setOauthPending(null)
      setPendingSites([])
      setPendingProjects([])
      setSelectedPendingProject('')
      setSiteUrl(result.workspace.jira_site_url || '')
      setProjectKey(result.workspace.jira_project_key || '')
      if (result.sync) {
        setToast({
          type: 'success',
          message: `Jira connected. Synced ${result.sync.synced} issue${result.sync.synced === 1 ? '' : 's'}.`,
        })
      } else {
        setToast({
          type: 'error',
          message: result.sync_error || 'Jira connected, but the first sync failed. Use Sync with Jira.',
        })
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to confirm Jira project.' })
    } finally {
      setPendingBusy(false)
    }
  }

  const handleCancelPending = async () => {
    if (!workspace?.id) return
    setPendingBusy(true)
    try {
      await cancelPendingJiraOAuth(workspace.id)
      setOauthPending(null)
      setPendingSites([])
      setSelectedPendingSite('')
      setPendingProjects([])
      setSelectedPendingProject('')
      setToast({ type: 'success', message: 'Pending Jira connection cancelled.' })
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to cancel pending connection.' })
    } finally {
      setPendingBusy(false)
    }
  }

  const handleOAuthConnect = async () => {
    if (!workspace?.id) return
    clearError()
    setToast(null)
    try {
      await startWorkspaceJiraOAuth(workspace.id, {
        return_to: '/admin?tab=jira',
      })
    } catch {
      setToast({ type: 'error', message: 'Failed to start Jira OAuth. Try again or use an API token.' })
    }
  }

  const handleOAuthReconnect = async () => {
    if (!workspace?.id) return
    clearError()
    setToast(null)
    try {
      await startWorkspaceJiraOAuth(workspace.id, {
        return_to: '/admin?tab=jira',
        mode: 'reconnect',
      })
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to start Jira reconnect.' })
    }
  }

  const handleOAuthChangeSiteProject = async () => {
    if (!workspace?.id) return
    clearError()
    setToast(null)
    try {
      await startWorkspaceJiraOAuth(workspace.id, {
        return_to: '/admin?tab=jira',
        mode: 'change',
      })
    } catch {
      setToast({ type: 'error', message: 'Failed to start change site/project. Try again.' })
    }
  }

  const handleConnect = async (e) => {
    e.preventDefault()
    if (!workspace?.id) return
    clearError()
    setToast(null)
    try {
      await connectJira(workspace.id, {
        jira_site_url: siteUrl.trim(),
        jira_project_key: projectKey.trim(),
        access_token: accessToken.trim(),
      })
      setAccessToken('')
      setToast({ type: 'success', message: 'Jira connected successfully.' })
    } catch {
      setToast({ type: 'error', message: 'Failed to connect Jira. Check your credentials and try again.' })
    }
  }

  const handleDisconnect = async () => {
    if (!workspace?.id) return
    clearError()
    setToast(null)
    try {
      await disconnectJira(workspace.id)
      setSiteUrl('')
      setProjectKey('')
      setAccessToken('')
      setToast({ type: 'success', message: 'Jira disconnected.' })
    } catch {
      setToast({ type: 'error', message: 'Failed to disconnect Jira.' })
    }
  }

  const handleSync = async () => {
    if (!workspace?.id) return
    clearError()
    setToast(null)
    try {
      const result = await syncJiraTasks(workspace.id)
      setToast({
        type: 'success',
        message: `Synced ${result.synced} issue${result.synced === 1 ? '' : 's'} from Jira.`,
      })
    } catch {
      setToast({
        type: 'error',
        message: 'Jira sync failed. Check your connection settings and try again.',
      })
    }
  }

  if (!workspace) {
    return (
      <div className="ds-card ds-card-pad-lg py-10 flex flex-col items-center gap-4 text-center max-w-[560px]">
        <p className="ds-section-title">Create a workspace first</p>
        <p className="ds-body-sm">
          You need a workspace before syncing tasks from Jira.
        </p>
        <button
          type="button"
          onClick={() => navigate('/workspace/create')}
          className="ds-btn-primary ds-focus-ring px-5 py-2.5 rounded-[var(--radius-md)] text-[length:var(--text-body)] font-semibold"
        >
          Create Workspace
        </button>
      </div>
    )
  }

  const isConnected = Boolean(workspace.jira_connected)
  const identityCue = jiraIdentityCue({
    jira_project_key: workspace.jira_project_key,
    jira_site_url: workspace.jira_site_url,
    team_jira_site_host: workspace.team_jira_site_host,
    jira_connected: workspace.jira_connected,
    team_jira_connected: workspace.jira_connected,
  })

  return (
    <div className="max-w-[640px] flex flex-col gap-6">
      {toast && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-[var(--radius-lg)] ds-body-sm font-medium ${
            toast.type === 'success'
              ? 'text-[color:var(--color-success-600)] bg-[color:var(--color-success-100)] border border-[color:var(--color-success-200)]'
              : 'text-[color:var(--color-error-500)] bg-[color:var(--color-error-100)] border border-[color:var(--color-error-200)]'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="ds-card ds-card-pad flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="ds-section-title">Linked Jira</h3>
            <p className="ds-body-sm mt-1">
              Store your workspace Jira credentials for syncing tasks into{' '}
              <strong>{workspace.name}</strong>.
            </p>
            <p className="ds-body-sm mt-2 text-[color:var(--color-text-muted)]">
              Identity:{' '}
              <strong className="text-[color:var(--color-gray-800)]">{identityCue}</strong>
            </p>
          </div>
          <span
            className={`shrink-0 ds-caption font-semibold px-2.5 py-1 rounded-[var(--radius-md)] ${
              isConnected
                ? 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-600)]'
                : 'bg-[color:var(--color-bg-muted)] text-[color:var(--color-text-muted)]'
            }`}
          >
            {isConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        {error && (
          <div className="rounded-[var(--radius-md)] bg-[color:var(--color-error-50)] border border-[color:var(--color-error-200)] px-4 py-3 ds-body-sm text-[color:var(--color-error-600)]">
            {error}
          </div>
        )}

        
        {oauthPending && pendingSites.length > 0 && !oauthPending.selected_site_url && (
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border-brand)] bg-[color:var(--color-bg-brand-subtle)] px-4 py-4 flex flex-col gap-3">
            <div>
              <h4 className="ds-body font-semibold text-[color:var(--color-gray-900)]">Confirm Jira site</h4>
              <p className="ds-body-sm mt-1 text-[color:var(--color-text-muted)]">
                Choose the Atlassian site for this workspace. You must confirm even if only one site appears.
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              {pendingSites.map((site) => (
                <li key={site.id}>
                  <label className="flex items-start gap-3 cursor-pointer rounded-[var(--radius-md)] border border-[color:var(--color-border-soft)] bg-[color:var(--color-card-surface)] px-3 py-2.5">
                    <input
                      type="radio"
                      name="pending-jira-site"
                      className="mt-1"
                      checked={selectedPendingSite === site.url}
                      onChange={() => setSelectedPendingSite(site.url)}
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold text-[color:var(--color-gray-900)] truncate">{site.name}</span>
                      <span className="block ds-body-sm text-[color:var(--color-text-muted)] truncate">{site.url}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleConfirmPendingSite}
                disabled={pendingBusy || !selectedPendingSite}
                className="ds-btn-primary ds-focus-ring px-5 py-2.5 rounded-[var(--radius-md)] text-[length:var(--text-body)] font-semibold disabled:opacity-55"
              >
                {pendingBusy ? 'Saving…' : 'Confirm site'}
              </button>
              <button
                type="button"
                onClick={handleCancelPending}
                disabled={pendingBusy}
                className="ds-focus-ring px-4 py-2.5 rounded-[var(--radius-md)] ds-body-sm font-semibold text-[color:var(--color-text-muted)] border border-[color:var(--color-border-soft)] bg-[color:var(--color-card-surface)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {oauthPending?.selected_site_url && (
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border-brand)] bg-[color:var(--color-bg-brand-subtle)] px-4 py-4 flex flex-col gap-3">
            <div>
              <h4 className="ds-body font-semibold text-[color:var(--color-gray-900)]">Confirm Jira project</h4>
              <p className="ds-body-sm mt-1 text-[color:var(--color-text-muted)]">
                Site: <strong>{oauthPending.selected_site_url}</strong>. Choose a project to finish connecting.
                You must confirm even if only one project appears.
              </p>
            </div>
            {pendingProjects.length === 0 ? (
              <p className="ds-body-sm text-[color:var(--color-text-muted)]">Loading projects…</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {pendingProjects.map((project) => (
                  <li key={project.key}>
                    <label className="flex items-start gap-3 cursor-pointer rounded-[var(--radius-md)] border border-[color:var(--color-border-soft)] bg-[color:var(--color-card-surface)] px-3 py-2.5">
                      <input
                        type="radio"
                        name="pending-jira-project"
                        className="mt-1"
                        checked={selectedPendingProject === project.key}
                        onChange={() => setSelectedPendingProject(project.key)}
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold text-[color:var(--color-gray-900)] truncate">
                          {project.name}
                        </span>
                        <span className="block ds-body-sm text-[color:var(--color-text-muted)] truncate">
                          {project.key}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleConfirmPendingProject}
                disabled={pendingBusy || !selectedPendingProject}
                className="ds-btn-primary ds-focus-ring px-5 py-2.5 rounded-[var(--radius-md)] text-[length:var(--text-body)] font-semibold disabled:opacity-55"
              >
                {pendingBusy ? 'Connecting…' : 'Confirm project'}
              </button>
              <button
                type="button"
                onClick={handleCancelPending}
                disabled={pendingBusy}
                className="ds-focus-ring px-4 py-2.5 rounded-[var(--radius-md)] ds-body-sm font-semibold text-[color:var(--color-text-muted)] border border-[color:var(--color-border-soft)] bg-[color:var(--color-card-surface)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Jira site URL</FieldLabel>
            <TextInput
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://yourteam.atlassian.net"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Project key</FieldLabel>
            <TextInput
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value)}
              placeholder="QUEST"
            />
          </div>

          {oauthAvailable && !showManual && (
            <div className="flex items-center gap-3 flex-wrap">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={handleOAuthConnect}
                  disabled={isLoading || pendingBusy || Boolean(oauthPending)}
                  className="ds-btn-primary ds-focus-ring px-5 py-2.5 rounded-[var(--radius-md)] text-[length:var(--text-body)] font-semibold disabled:opacity-55"
                >
                  {isLoading ? 'Redirecting…' : 'Connect with Atlassian'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleOAuthReconnect}
                    disabled={isLoading || pendingBusy || Boolean(oauthPending)}
                    className="ds-btn-primary ds-focus-ring px-5 py-2.5 rounded-[var(--radius-md)] text-[length:var(--text-body)] font-semibold disabled:opacity-55"
                  >
                    {isLoading ? 'Redirecting…' : 'Reconnect'}
                  </button>
                  <button
                    type="button"
                    onClick={handleOAuthChangeSiteProject}
                    disabled={isLoading || pendingBusy || Boolean(oauthPending)}
                    className="ds-focus-ring px-4 py-2.5 rounded-[var(--radius-md)] ds-body-sm font-semibold text-[color:var(--color-gray-800)] border border-[color:var(--color-border-soft)] bg-[color:var(--color-card-surface)] disabled:opacity-55"
                  >
                    Change site or project
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowManual(true)}
                className="ds-body-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gray-700)] hover:bg-[color:var(--color-bg-subtle)] px-2 py-1 rounded-[var(--radius-md)] cursor-pointer ds-focus-ring transition-colors"
              >
                Advanced: use API token
              </button>
              {isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-[var(--radius-md)] ds-body font-semibold text-[color:var(--color-error-500)] bg-[color:var(--color-error-100)] border border-[color:var(--color-error-200)] cursor-pointer disabled:opacity-60 ds-focus-ring transition-colors hover:bg-[color:var(--color-error-200)]"
                >
                  Disconnect
                </button>
              )}
            </div>
          )}

          {showManual && (
            <form onSubmit={handleConnect} className="flex flex-col gap-4">
              {oauthAvailable && (
                <button
                  type="button"
                  onClick={() => setShowManual(false)}
                  className="self-start ds-body-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gray-700)] hover:bg-[color:var(--color-bg-subtle)] px-2 py-1 rounded-[var(--radius-md)] cursor-pointer ds-focus-ring transition-colors"
                >
                  Back to Atlassian OAuth
                </button>
              )}
              <div className="flex flex-col gap-1.5">
                <FieldLabel>API token</FieldLabel>
                <TextInput
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder={isConnected ? 'Enter a new token to update' : 'Your Atlassian API token'}
                />
                <p className="ds-caption text-[color:var(--color-text-subtle)]">
                  Use the email on your Questly admin account with this token. Tokens are stored securely
                  and never shown again.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={isLoading || !siteUrl.trim() || !projectKey.trim() || !accessToken.trim()}
                  className="ds-btn-primary ds-focus-ring px-5 py-2.5 rounded-[var(--radius-md)] text-[length:var(--text-body)] font-semibold"
                >
                  {isLoading ? 'Connecting…' : isConnected ? 'Update connection' : 'Connect with token'}
                </button>
                {isConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-[var(--radius-md)] ds-body font-semibold text-[color:var(--color-error-500)] bg-[color:var(--color-error-100)] border border-[color:var(--color-error-200)] cursor-pointer disabled:opacity-60 ds-focus-ring transition-colors hover:bg-[color:var(--color-error-200)]"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="ds-card ds-card-pad flex flex-col gap-6">
        <div>
          <h3 className="ds-section-title">Sync tasks from Jira</h3>
          <p className="ds-body-sm mt-1">
            Pull issues from your Jira project. Developers see assigned tasks on their Task List.
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border-soft)] px-4 py-3 ds-body-sm leading-relaxed">
          Difficulty and XP come from <strong>Jira story points</strong>: 1–2 pts → Easy (20 XP),
          3–5 → Medium (40 XP), 8+ → Hard (70 XP). Coins are awarded when developers complete tasks.
        </div>

        {lastJiraSyncResult && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Issues synced', value: lastJiraSyncResult.synced },
              { label: 'Created', value: lastJiraSyncResult.created },
              { label: 'Updated', value: lastJiraSyncResult.updated },
              { label: 'Removed', value: lastJiraSyncResult.pruned },
              { label: 'Assignments', value: lastJiraSyncResult.assignments },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-[var(--radius-md)] bg-[color:var(--color-bg-brand-subtle)] border border-[color:var(--color-border-brand)] shadow-[var(--shadow-soft-sm)] px-3 py-2 text-center"
              >
                <p className="text-[length:var(--text-h5)] font-bold text-[color:var(--color-brand)]">{value ?? 0}</p>
                <p className="ds-caption">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="ds-caption text-[color:var(--color-text-subtle)]">
            {lastJiraSyncAt
              ? `Last synced ${formatSyncTime(lastJiraSyncAt)}`
              : 'Not synced yet this session'}
          </p>
          <button
            type="button"
            onClick={handleSync}
            disabled={isLoading || !isConnected}
            className="inline-flex items-center gap-2 ds-btn-primary ds-focus-ring px-5 py-2.5 rounded-[var(--radius-md)] text-[length:var(--text-body)] font-semibold"
          >
            <SyncIcon />
            {isLoading ? 'Syncing…' : 'Sync with Jira'}
          </button>
        </div>
      </div>
    </div>
  )
}
