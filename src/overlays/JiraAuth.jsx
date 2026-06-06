import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import jiraLogo from '../assets/jira-original-wordmark.svg'
import JiraButton from '../design-system/components/JiraButton'
import { useAuthStore } from '../stores/authStore'

const ATLASSIAN_TOKEN_URL = 'https://id.atlassian.com/manage-profile/security/api-tokens'

const CheckIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-[14px] h-[14px]">
    <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const features = [
  'Sync tasks automatically',
  'Track progress & earn XP',
  'Read-only access (no changes in Jira)',
]

export default function JiraAuth({ onClose, onConnect, onSkip }) {
  const location = useLocation()
  const startJiraOAuth = useAuthStore((s) => s.startJiraOAuth)
  const fetchJiraOAuthStatus = useAuthStore((s) => s.fetchJiraOAuthStatus)
  const connectJira = useAuthStore((s) => s.connectJira)
  const isLoading = useAuthStore((s) => s.isLoading)
  const [oauthAvailable, setOauthAvailable] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchJiraOAuthStatus().then((status) => {
      setOauthAvailable(Boolean(status.available))
      if (!status.available) setShowManual(true)
    })
  }, [fetchJiraOAuthStatus])

  const handleOAuthConnect = async () => {
    setError(null)
    const returnTo = ['/signup', '/login'].includes(location.pathname)
      ? '/dashboard'
      : (location.pathname || '/dashboard')
    const result = await startJiraOAuth(returnTo)
    if (!result.ok) {
      setError(result.error || 'Failed to start Jira connection.')
    }
  }

  const handleManualConnect = async () => {
    if (!accessToken.trim()) {
      setError('Enter your Jira API token to connect.')
      return
    }
    setError(null)
    const result = await connectJira(accessToken.trim())
    if (result.ok) {
      onConnect?.()
    } else {
      setError(result.error || 'Failed to connect Jira.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="flex flex-col items-center gap-8"
        style={{ animation: 'heroFadeUp 0.35s ease both' }}
      >

        <div
          className="bg-white rounded-[16px] w-[640px] pt-[56px] px-[56px] pb-[56px] relative flex flex-col items-center gap-8"
          style={{ boxShadow: '0px 8px 32px 0px rgba(148, 47, 205, 0.12)' }}
        >

          <button
            onClick={onClose}
            className="absolute top-4 right-5 text-[#9ca3af] hover:text-[#374151] text-[22px] leading-none cursor-pointer transition-colors duration-200"
          >
            ✕
          </button>

          <div
            className="w-[80px] h-[80px] rounded-[16px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(to bottom, #fcfcfc, #87b9fb)',
              boxShadow: '0px 4px 16px 0px rgba(0, 82, 204, 0.2)',
            }}
          >
            <img src={jiraLogo} alt="Jira" className="w-[52px] h-[52px] object-contain" />
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <h2
              className="text-[36px] font-semibold text-black leading-tight"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Connect your Jira account
            </h2>
            <p
              className="text-[18px] text-[#6b7280]"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Optional now — join your team first, then connect your personal Jira on Profile after
              admin approval.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-[400px]">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(to bottom, #942fcd, #ca9af4)' }}
                >
                  <CheckIcon />
                </div>
                <span
                  className="text-[16px] font-medium text-[#1f2937]"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-[13px] text-[#ef4444] -mt-4">{error}</p>
          )}

          <div className="flex flex-col items-center gap-3 w-[400px]">
            {oauthAvailable && (
              <JiraButton onClick={handleOAuthConnect} disabled={isLoading}>
                {isLoading ? 'Redirecting…' : 'Connect with Jira'}
              </JiraButton>
            )}

            {oauthAvailable && !showManual && (
              <button
                type="button"
                onClick={() => setShowManual(true)}
                className="text-[13px] text-[#6b7280] hover:text-[#374151] cursor-pointer"
              >
                Use API token instead
              </button>
            )}

            {showManual && (
              <div className="w-full flex flex-col gap-2">
                {oauthAvailable && (
                  <button
                    type="button"
                    onClick={() => setShowManual(false)}
                    className="self-start text-[12px] text-[#6b7280] hover:text-[#374151] cursor-pointer mb-1"
                  >
                    Back to OAuth
                  </button>
                )}
                <label
                  htmlFor="jira-access-token"
                  className="text-[14px] font-medium text-[#374151]"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Jira API token
                </label>
                <input
                  id="jira-access-token"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Paste your Atlassian API token"
                  className="w-full px-4 py-3 rounded-[10px] border border-[#e5e7eb] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#942fcd]/30 focus:border-[#942fcd]"
                />
                <p className="text-[12px] text-[#9ca3af]">
                  <a
                    href={ATLASSIAN_TOKEN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#942fcd] hover:underline"
                  >
                    Create an API token at Atlassian
                  </a>
                  . Use the same email as your Questly account.
                </p>
                <JiraButton onClick={handleManualConnect} disabled={isLoading}>
                  {isLoading ? 'Connecting…' : 'Connect with token'}
                </JiraButton>
              </div>
            )}

            <button
              type="button"
              onClick={onSkip || onClose}
              className="text-[14px] text-[#6b7280] hover:text-[#374151] cursor-pointer"
            >
              Skip for now
            </button>
          </div>

        </div>

        <p
          className="text-[14px] text-[#9ca3af] text-center max-w-[611px] leading-[1.6]"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {oauthAvailable
            ? 'Questly uses secure Atlassian OAuth for read-only access to your Jira tasks.'
            : 'Questly uses your personal API token for read-only access to your Jira tasks.'}
        </p>

      </div>
    </div>
  )
}
