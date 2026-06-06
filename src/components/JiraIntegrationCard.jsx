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
    const result = await startJiraOAuth(location.pathname || '/profile')
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
    <div className="p-4 bg-[#f8faff] rounded-[10px] border border-[#dbeafe] mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img src={jiraLogo} alt="Jira" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
          <span className="text-[13px] font-medium text-[#1f2937]">Jira Integration</span>
        </div>
        <span
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[6px] ${
            isConnected
              ? 'bg-[#d1fae5] text-[#059669]'
              : hasWorkspace
                ? 'bg-[#f3f4f6] text-[#6b7280]'
                : 'bg-[#fef3c7] text-[#d97706]'
          }`}
        >
          {isConnected && <CheckIcon />}
          {statusLabel}
        </span>
      </div>

      {message && (
        <p
          className={`text-[11px] mb-2 ${
            message.type === 'success' ? 'text-[#059669]' : 'text-[#ef4444]'
          }`}
        >
          {message.text}
        </p>
      )}

      {showConnectForm && !hasWorkspace && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[12px] text-[#6b7280] leading-relaxed">{NO_WORKSPACE_COPY}</p>
          <p className="text-[11px] text-[#9ca3af]">
            Jira links your Atlassian identity to assigned tasks. You can set it up on Profile after
            your admin approves you.
          </p>
          <Link
            to="/workspace/join"
            className="self-start text-[12px] font-semibold text-[#942fcd] hover:underline"
          >
            Join a workspace
          </Link>
        </div>
      )}

      {showConnectForm && hasWorkspace && !isConnected && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[11px] text-[#6b7280]">
            Connect your Jira account to receive tasks assigned to you in Questly.
          </p>
          {oauthAvailable && (
            <button
              type="button"
              onClick={handleOAuthConnect}
              disabled={isLoading}
              className="self-start px-3 py-1.5 rounded-[6px] text-[12px] font-semibold text-white cursor-pointer disabled:opacity-60"
              style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
            >
              {isLoading ? 'Redirecting…' : 'Connect with Jira'}
            </button>
          )}

          {oauthAvailable && !showManual && (
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="self-start text-[11px] text-[#6b7280] hover:text-[#374151] cursor-pointer"
            >
              Use API token instead
            </button>
          )}

          {showManual && (
            <form onSubmit={handleManualConnect} className="flex flex-col gap-2">
              {oauthAvailable && (
                <button
                  type="button"
                  onClick={() => setShowManual(false)}
                  className="self-start text-[11px] text-[#6b7280] hover:text-[#374151] cursor-pointer"
                >
                  Back to OAuth
                </button>
              )}
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Jira API token"
                className="w-full px-3 py-2 rounded-[8px] border border-[#e5e7eb] text-[12px] focus:outline-none focus:ring-2 focus:ring-[#942fcd]/30"
              />
              <a
                href={ATLASSIAN_TOKEN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#942fcd] hover:underline"
              >
                Create an API token at Atlassian
              </a>
              <button
                type="submit"
                disabled={isLoading || !accessToken.trim()}
                className="self-start px-3 py-1.5 rounded-[6px] text-[12px] font-semibold text-white cursor-pointer disabled:opacity-60"
                style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
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
          className="mt-2 text-[11px] font-semibold text-[#ef4444] cursor-pointer disabled:opacity-60"
        >
          Disconnect Jira
        </button>
      )}

      {!showConnectForm && (
        <p className="text-[11px] text-[#9ca3af]">
          Manage team Jira sync in the Admin panel.
        </p>
      )}
    </div>
  )
}
