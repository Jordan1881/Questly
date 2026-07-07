import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import jiraLogo from '../assets/jira-original-wordmark.svg'
import { useAuthStore } from '../stores/authStore'

const ATLASSIAN_TOKEN_URL = 'https://id.atlassian.com/manage-profile/security/api-tokens'

const NO_WORKSPACE_COPY =
  'Join a team first, or connect Jira after your admin approves you.'

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
  const connectJira = useAuthStore((s) => s.connectJira)
  const disconnectJira = useAuthStore((s) => s.disconnectJira)
  const [oauthAvailable, setOauthAvailable] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [message, setMessage] = useState(null)

  const hasWorkspace = Boolean(user?.workspace_id)
  const isConnected = Boolean(user?.jira_connected)
  const teamHost = user?.team_jira_site_host
  const teamJiraReady = Boolean(user?.team_jira_connected)

  useEffect(() => {
    fetchJiraOAuthStatus().then((status) => {
      setOauthAvailable(Boolean(status.available))
      if (!status.available) setShowManual(true)
    })
  }, [fetchJiraOAuthStatus])

  const handleOAuthConnect = async () => {
    if (!hasWorkspace) {
      setMessage({ type: 'error', text: NO_WORKSPACE_COPY })
      return
    }
    setMessage(null)
    const result = await startJiraOAuth(location.pathname || '/settings')
    if (!result.ok) {
      setMessage({ type: 'error', text: result.error || 'Failed to start Jira connection.' })
    }
  }

  const handleManualConnect = async (e) => {
    e.preventDefault()
    if (!hasWorkspace) {
      setMessage({ type: 'error', text: NO_WORKSPACE_COPY })
      return
    }
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

  const statusLabel = isConnected ? 'Connected' : hasWorkspace ? 'Not connected' : 'Awaiting team'

  return (
    <div className="p-4 bg-[color:var(--color-bg-brand-subtle)] rounded-[10px] border border-[color:var(--color-border-brand)] mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img src={jiraLogo} alt="Jira" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
          <span className="text-[length:var(--text-body-sm)] font-medium text-[color:var(--color-gray-800)]">Jira Integration</span>
        </div>
        <span
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius-md)] ${
            isConnected
              ? 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-600)]'
              : hasWorkspace
                ? 'bg-[color:var(--color-gray-100)] text-[color:var(--color-gray-500)]'
                : 'bg-[color:var(--color-warning-100)] text-[color:var(--color-warning-600)]'
          }`}
        >
          {isConnected && <CheckIcon />}
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

      {showConnectForm && !hasWorkspace && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-gray-500)] leading-relaxed">{NO_WORKSPACE_COPY}</p>
          <p className="text-[11px] text-[color:var(--color-gray-400)]">
            Jira links your Atlassian identity to assigned tasks. You can set it up in Settings after
            your admin approves you.
          </p>
          <Link
            to="/workspace/join"
            className="self-start text-[length:var(--text-caption)] font-semibold text-[color:var(--color-brand)] hover:underline"
          >
            Join a workspace
          </Link>
        </div>
      )}

      {showConnectForm && hasWorkspace && !teamJiraReady && !isConnected && (
        <p className="text-[length:var(--text-caption)] text-[color:var(--color-gray-500)] mt-2 leading-relaxed">
          Your admin has not connected team Jira yet. You can link your personal Jira account
          after they set up Jira sync in Admin.
        </p>
      )}

      {showConnectForm && hasWorkspace && teamJiraReady && !isConnected && (
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
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Jira API token"
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] text-[length:var(--text-caption)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]/30"
              />
              <a
                href={ATLASSIAN_TOKEN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[color:var(--color-brand)] hover:underline"
              >
                Create an API token at Atlassian
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

      {showConnectForm && hasWorkspace && isConnected && (
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={isLoading}
          className="mt-2 text-[11px] font-semibold text-[color:var(--color-error-500)] cursor-pointer disabled:opacity-60"
        >
          Disconnect Jira
        </button>
      )}

      {!showConnectForm && (
        <p className="text-[11px] text-[color:var(--color-gray-400)]">
          Manage team Jira sync in the Admin panel.
        </p>
      )}
    </div>
  )
}
