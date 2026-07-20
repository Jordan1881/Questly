import { useEffect, useState } from 'react'
import { apiFetch, apiUrl } from '../lib/api'

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.5 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.1-1.5H12z"
    />
    <path fill="#34A853" d="M3.9 7.4l3.2 2.4C8 7.7 9.9 6.5 12 6.5c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.5 2.3 12 2.3 8.4 2.3 5.3 4.4 3.9 7.4z" />
    <path fill="#4A90E2" d="M12 20.7c2.4 0 4.5-.8 6-2.2l-2.9-2.3c-.8.6-1.9 1-3.1 1-3.1 0-5.7-2.1-6.6-4.9l-3.2 2.5c1.4 2.9 4.4 4.9 7.8 4.9z" />
    <path fill="#FBBC05" d="M5.4 12.5c0-.6.1-1.2.3-1.8L2.5 8.2C1.9 9.4 1.6 10.7 1.6 12.1c0 1.4.3 2.7.9 3.9l3.2-2.5c-.2-.5-.3-1.1-.3-1z" />
  </svg>
)

/**
 * Shown only when Cognito Google sign-in is configured on the API.
 * Navigates to the API Cognito Google start URL (VITE_API_URL in prod; Vite proxy locally).
 */
export default function GoogleSignInButton({ className = '' }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiFetch('/api/auth/cognito/status', { skipSessionExpiry: true })
      .then((body) => {
        if (!cancelled) setEnabled(Boolean(body?.enabled))
      })
      .catch(() => {
        if (!cancelled) setEnabled(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!enabled) return null

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center gap-3 text-[12px] text-[color:var(--color-text-muted)]">
        <span className="flex-1 h-px bg-[color:var(--color-border-soft)]" />
        <span>or</span>
        <span className="flex-1 h-px bg-[color:var(--color-border-soft)]" />
      </div>
      <a
        href={apiUrl('/api/auth/cognito/google/start')}
        className="w-full inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border-soft)] bg-white px-4 py-3 text-[14px] font-medium text-[color:var(--color-gray-900)] hover:bg-[color:var(--color-gray-50)] transition-colors duration-200 ds-focus-ring"
      >
        <GoogleIcon />
        Continue with Google
      </a>
    </div>
  )
}
