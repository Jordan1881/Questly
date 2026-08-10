import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import jiraLogo from '../assets/jira-original-wordmark.svg'
import { useAuthStore } from '../stores/authStore'

const ATLASSIAN_TOKEN_URL = 'https://id.atlassian.com/manage-profile/security/api-tokens'

const CheckIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 shrink-0">
    <path d="M2 7l3.5 3.5 6.5-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function JiraIntegrationCard({ showConnectForm = true }) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const startJiraOAuth = useAuthStore((s) => s.startJiraOAuth)
  const fetchJiraOAuthStatus = useAuthStore((s) => s.fetchJiraOAuthStatus)
  const fetchPendingJiraOAuth = useAuthStore((s) => s.fetchPendingJiraOAuth)
  const fetchPendingJiraOAuthSites = useAuthStore((s) => s.fetchPendingJiraOAuthSites)
  const confirmPendingJiraOAuthSite = useAuthStore((s) => s.confirmPendingJiraOAuthSite)
  const cancelPendingJiraOAuth = useAuthStore((s) => s.cancelPendingJiraOAuth)
  const connectJira = useAuthStore((s) => s.connectJira)
  const disconnectJira = useAuthStore((s) => s.disconnectJira)
  const [oauthAvailable, setOauthAvailable] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [message, setMessage] = useState(null)
  const [oauthPending, setOauthPending] = useState(null)
  const [pendingSites, setPendingSites] = useState([])
  const [selectedSite, setSelectedSite] = useState('')
  const [pendingBusy, setPendingBusy] = useState(false)

  const hasWorkspace = Boolean(user?.workspace_id)
  const isConnected = Boolean(user?.jira_connected)
  const teamHost = user?.team_jira_site_host
  const teamJiraReady = Boolean(user?.team_jira_connected)
  const siteMismatch = Boolean(user?.personal_jira_site_mismatch)
  // Free picker when no team site yet; locked confirm when team Jira is connected.
  const canStartOAuth = !hasWorkspace || teamJiraReady || !teamHost

  const loadPending = async () => {
    try {
      const pending = await fetchPendingJiraOAuth()
      setOauthPending(pending)
      if (!pending) {
        setPendingSites([])
        setSelectedSite('')
        return
      }
      const { sites, site_locked, locked_site_url } = await fetchPendingJiraOAuthSites()
      setPendingSites(sites || [])
      if (site_locked && locked_site_url) setSelectedSite(locked_site_url)
      else if (sites?.length === 1) setSelectedSite(sites[0].url)
    } catch (err) {
      setOauthPending(null)
      setPendingSites([])
      setMessage({ type: 'error', text: err.message || 'Could not load pending Jira sites.' })
      setShowManual(true)
    }
  }

  useEffect(() => {
    fetchJiraOAuthStatus().then((status) => {
      setOauthAvailable(Boolean(status.available))
      if (!status.available) setShowManual(true)
    })
  }, [fetchJiraOAuthStatus])

  useEffect(() => {
    let cancelled = false
    // Defer so setState inside loadPending is not treated as synchronous in the effect body.
    Promise.resolve().then(() => {
      if (cancelled) return
      loadPending().catch(() => {})
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, location.search])

  const handleOAuthConnect = async () => {
    setMessage(null)
    const result = await startJiraOAuth(location.pathname || '/settings')
    if (!result.ok) {
      setMessage({ type: 'error', text: result.error || 'Failed to start Jira connection.' })
    }
  }

  const handleConfirmPending = async () => {
    if (!selectedSite) return
    setPendingBusy(true)
    setMessage(null)
    try {
      const result = await confirmPendingJiraOAuthSite(selectedSite)
      setOauthPending(null)
      setPendingSites([])
      setMessage({
        type: 'success',
        text: `Jira connected to ${result.confirmed_site_url || selectedSite}.`,
      })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to confirm Jira site.' })
    } finally {
      setPendingBusy(false)
    }
  }

  const handleCancelPending = async () => {
    setPendingBusy(true)
    try {
      await cancelPendingJiraOAuth()
      setOauthPending(null)
      setPendingSites([])
      setSelectedSite('')
      setMessage({ type: 'success', text: 'Pending Jira connection cancelled.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to cancel.' })
    } finally {
      setPendingBusy(false)
    }
  }

  const handleManualConnect = async (e) => {
    e.preventDefault()
    if (!accessToken.trim()) return
    setMessage(null)
    const result = await connectJira(accessToken.trim())
    if (result.ok) {
      setAccessToken('')
      setMessage({ type: 'success', text: 'Jira connected.' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to connect Jira.' })
    }
  }

  const handleDisconnect = async () => {
    setMessage(null)
    const result = await disconnectJira()
    if (result.ok) {
      setMessage({ type: 'success', text: 'Jira disconnected.' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to disconnect Jira.' })
    }
  }

  const statusLabel = isConnected
    ? siteMismatch
      ? 'Reconnect needed'
      : 'Connected'
    : hasWorkspace
      ? 'Not connected'
      : 'Awaiting team'

  return (
    <div className="p-4 bg-[color:var(--color-bg-brand-subtle)] rounded-[var(--radius-lg)] border border-[color:var(--color-border-brand)] shadow-[var(--shadow-soft-sm)] mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img src={jiraLogo} alt="Jira" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
          <span className="text-[length:var(--text-body-sm)] font-medium text-[color:var(--color-gray-800)]">Jira Integration</span>
        </div>
        <span
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius-md)] ${
            isConnected && !siteMismatch
              ? 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-600)]'
              : siteMismatch
                ? 'bg-[color:var(--color-warning-100)] text-[color:var(--color-warning-600)]'
                : hasWorkspace
                  ? 'bg-[color:var(--color-gray-100)] text-[color:var(--color-gray-500)]'
                  : 'bg-[color:var(--color-warning-100)] text-[color:var(--color-warning-600)]'
          }`}
        >
          {isConnected && !siteMismatch && <CheckIcon />}
          {statusLabel}
        </span>
      </div>

      {message && (
        <p
          className={`text-[11px] mb-2 ${
            message.type === 'success' ? 'text-[color:var(--color-success-600)]' : 'text-[color:var(--color-error-500)]'
          }`}
        >
          {message.text}
        </p>
      )}

      {siteMismatch && (
        <div className="mb-3 rounded-[var(--radius-md)] border border-[color:var(--color-warning-200)] bg-[color:var(--color-warning-50)] px-3 py-2">
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-warning-700)] leading-relaxed">
            Your personal Jira site does not match the team site ({teamHost}). Reconnect and confirm
            the team site before assignee sync can be trusted.
          </p>
          {oauthAvailable && (
            <button
              type="button"
              onClick={handleOAuthConnect}
              disabled={isLoading || pendingBusy}
              className="mt-2 self-start px-3 py-1.5 rounded-[var(--radius-md)] text-[length:var(--text-caption)] font-semibold text-white cursor-pointer disabled:opacity-60 ds-brand-gradient"
            >
              Reconnect to team site
            </button>
          )}
        </div>
      )}

      {oauthPending && pendingSites.length > 0 && (
        <div className="mb-3 flex flex-col gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border-brand)] bg-[color:var(--color-card-surface)] px-3 py-3">
          <p className="text-[length:var(--text-caption)] font-semibold text-[color:var(--color-gray-900)]">
            {oauthPending.site_locked ? 'Confirm team Jira site' : 'Confirm Jira site'}
          </p>
          <p className="text-[11px] text-[color:var(--color-gray-500)]">
            {oauthPending.site_locked
              ? 'Your team site is locked below. Confirm to finish connecting.'
              : 'Choose a site. You must confirm even if only one appears.'}
          </p>
          <ul className="flex flex-col gap-1.5">
            {pendingSites.map((site) => (
              <li key={site.id || site.url}>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dev-pending-jira-site"
                    className="mt-1"
                    disabled={Boolean(oauthPending.site_locked)}
                    checked={selectedSite === site.url}
                    onChange={() => setSelectedSite(site.url)}
                  />
                  <span className="min-w-0">
                    <span className="block text-[length:var(--text-caption)] font-semibold truncate">{site.name}</span>
                    <span className="block text-[11px] text-[color:var(--color-gray-500)] truncate">{site.url}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleConfirmPending}
              disabled={pendingBusy || !selectedSite}
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-[length:var(--text-caption)] font-semibold text-white cursor-pointer disabled:opacity-60 ds-brand-gradient"
            >
              {pendingBusy ? 'Saving…' : 'Confirm site'}
            </button>
            <button
              type="button"
              onClick={handleCancelPending}
              disabled={pendingBusy}
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-[11px] font-semibold text-[color:var(--color-gray-600)] border border-[color:var(--color-border-soft)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showConnectForm && !hasWorkspace && !oauthPending && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-gray-500)] leading-relaxed">
            No team site yet — you can still connect a personal Jira account, or{' '}
            <Link to="/workspace/join" className="font-semibold text-[color:var(--color-brand)] hover:underline">
              join a workspace
            </Link>
            .
          </p>
          {oauthAvailable && (
            <button
              type="button"
              onClick={handleOAuthConnect}
              disabled={isLoading}
              className="self-start px-3 py-1.5 rounded-[var(--radius-md)] text-[length:var(--text-caption)] font-semibold text-white cursor-pointer disabled:opacity-60 ds-brand-gradient"
            >
              {isLoading ? 'Redirecting…' : 'Connect with Jira'}
            </button>
          )}
        </div>
      )}

      {showConnectForm && hasWorkspace && !teamJiraReady && !isConnected && !oauthPending && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-gray-500)] leading-relaxed">
            Your admin has not connected team Jira yet. You can still link a personal Jira site now.
          </p>
          {oauthAvailable && canStartOAuth && (
            <button
              type="button"
              onClick={handleOAuthConnect}
              disabled={isLoading}
              className="self-start px-3 py-1.5 rounded-[var(--radius-md)] text-[length:var(--text-caption)] font-semibold text-white cursor-pointer disabled:opacity-60 ds-brand-gradient"
            >
              {isLoading ? 'Redirecting…' : 'Connect with Jira'}
            </button>
          )}
        </div>
      )}

      {showConnectForm && hasWorkspace && teamJiraReady && !isConnected && !oauthPending && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[11px] text-[color:var(--color-gray-500)]">
            Connect your Jira account to receive tasks assigned to you in Questly.
            {teamHost ? (
              <>
                {' '}
                Your team site: <strong>{teamHost}</strong>. Use the same email as Questly (
                {user?.email}).
              </>
            ) : null}
          </p>
          {oauthAvailable && (
            <button
              type="button"
              onClick={handleOAuthConnect}
              disabled={isLoading}
              className="self-start px-3 py-1.5 rounded-[var(--radius-md)] text-[length:var(--text-caption)] font-semibold text-white cursor-pointer disabled:opacity-60 ds-brand-gradient"
            >
              {isLoading ? 'Redirecting…' : 'Connect with Jira'}
            </button>
          )}

          {oauthAvailable && !showManual && (
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="self-start text-[11px] text-[color:var(--color-gray-500)] hover:text-[color:var(--color-gray-700)] cursor-pointer"
            >
              Advanced: use API token
            </button>
          )}

          {showManual && (
            <form onSubmit={handleManualConnect} className="flex flex-col gap-2">
              {oauthAvailable && (
                <button
                  type="button"
                  onClick={() => setShowManual(false)}
                  className="self-start text-[11px] text-[color:var(--color-gray-500)] hover:text-[color:var(--color-gray-700)] cursor-pointer"
                >
                  Back to OAuth
                </button>
              )}
              <label className="text-[11px] font-medium text-[color:var(--color-gray-600)]">
                API token
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border-soft)] px-2 py-1.5 text-[length:var(--text-caption)]"
                  placeholder="Atlassian API token"
                />
              </label>
              <a
                href={ATLASSIAN_TOKEN_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[color:var(--color-brand)] hover:underline"
              >
                Create an API token
              </a>
              <button
                type="submit"
                disabled={isLoading || !accessToken.trim()}
                className="self-start px-3 py-1.5 rounded-[var(--radius-md)] text-[length:var(--text-caption)] font-semibold text-white cursor-pointer disabled:opacity-60 ds-brand-gradient"
              >
                {isLoading ? 'Connecting…' : 'Connect with token'}
              </button>
            </form>
          )}
        </div>
      )}

      {isConnected && !siteMismatch && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={isLoading}
            className="text-[11px] font-semibold text-[color:var(--color-error-500)] hover:underline disabled:opacity-60"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
