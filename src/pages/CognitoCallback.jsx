import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import AuthLayout from '../components/layout/AuthLayout'
import JiraAuth from '../overlays/JiraAuth'
import { useAuthStore } from '../stores/authStore'
import { resolvePostAuthPath } from '../lib/authRedirect'

export default function CognitoCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setSessionFromToken, fetchMe } = useAuthStore()
  const [error, setError] = useState(null)
  const [showJiraAuth, setShowJiraAuth] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function finish() {
      const cognitoError = searchParams.get('cognito')
      const reason = searchParams.get('reason')
      const token = searchParams.get('token')

      // Drop secrets / error params from the address bar.
      window.history.replaceState({}, document.title, '/auth/cognito/callback')

      if (cognitoError === 'error' || !token) {
        if (!cancelled) {
          setError(reason ? `Google sign-in failed (${reason})` : 'Google sign-in failed')
        }
        return
      }

      setSessionFromToken(token)
      await fetchMe().catch(() => {})
      if (cancelled) return

      const role = useAuthStore.getState().userRole
      const jiraConnected = useAuthStore.getState().user?.jira_connected
      if (role === 'developer' && !jiraConnected) {
        setShowJiraAuth(true)
      } else {
        navigate(await resolvePostAuthPath(), { replace: true })
      }
    }

    finish()
    return () => {
      cancelled = true
    }
    // Run once on mount with the initial query string.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finishAuth = async () => {
    setShowJiraAuth(false)
    navigate(await resolvePostAuthPath(), { replace: true })
  }

  return (
    <>
      <AuthLayout title="Signing you in…" subtitle="Finishing Google authentication">
        <div className="ds-card ds-card-pad w-[440px] flex flex-col gap-4 shrink-0 shadow-[var(--shadow-soft-md)]">
          {error ? (
            <>
              <p className="text-[14px] text-red-600">{error}</p>
              <a
                href="/login"
                className="text-[14px] text-[color:var(--color-brand)] hover:underline ds-focus-ring rounded-[var(--radius-sm)]"
              >
                Back to sign in
              </a>
            </>
          ) : (
            <p className="text-[14px] text-[color:var(--color-text-muted)]">Please wait…</p>
          )}
        </div>
      </AuthLayout>

      {showJiraAuth && (
        <JiraAuth onClose={finishAuth} onConnect={finishAuth} onSkip={finishAuth} />
      )}
    </>
  )
}
