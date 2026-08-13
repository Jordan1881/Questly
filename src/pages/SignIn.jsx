import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import AuthLayout, { authInputClass } from '../components/layout/AuthLayout'
import FormButton from '../design-system/components/FormButton'
import LegalFooterLinks from '../components/LegalFooterLinks'
import GoogleSignInButton from '../components/GoogleSignInButton'
import JiraAuth from '../overlays/JiraAuth'
import { useAuthStore } from '../stores/authStore'
import { resolvePostAuthPath } from '../lib/authRedirect'
import { warmupApi } from '../lib/api'

const EyeIcon = ({ open }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.574-3.007-9.964-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )

export default function SignIn() {
  const navigate = useNavigate()
  const { login, fetchMe, isLoading, error, clearError, sessionExpired, clearSessionExpired } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showJiraAuth, setShowJiraAuth] = useState(false)

  useEffect(() => {
    warmupApi()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    clearSessionExpired()
    const result = await login({ email, password })
    if (result.ok) {
      await fetchMe().catch(() => {})
      const role = useAuthStore.getState().userRole
      const jiraConnected = useAuthStore.getState().user?.jira_connected
      if (role === 'developer' && !jiraConnected) setShowJiraAuth(true)
      else navigate(await resolvePostAuthPath())
    }
  }

  const finishAuth = async () => {
    setShowJiraAuth(false)
    navigate(await resolvePostAuthPath())
  }

  return (
    <>
      <AuthLayout
        title="Sign in to Questly"
        subtitle="Log in to continue managing your tasks and progress"
        footer={
          <>
            <p>Don&apos;t have an account yet?</p>
            <p>
              You can{' '}
              <Link
                to="/signup"
                className="text-[color:var(--color-primary-700)] hover:underline ds-focus-ring rounded-[var(--radius-sm)]"
              >
                Register here !
              </Link>
            </p>
          </>
        }
      >
        <div className="ds-card ds-card-pad w-[440px] flex flex-col gap-8 shrink-0 shadow-[var(--shadow-soft-md)]">
          <h2 className="text-[32px] font-medium text-[color:var(--color-gray-900)] leading-tight">Sign in</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {sessionExpired && (
              <div className="rounded-[8px] bg-amber-50 border border-amber-200 px-4 py-3 text-[13px] text-amber-800">
                Your session expired. Please sign in again.
              </div>
            )}

            {error && (
              <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="signin-email"
                className="text-[14px] font-medium text-[color:var(--color-gray-900)]"
              >
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={authInputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="signin-password"
                className="text-[14px] font-medium text-[color:var(--color-gray-900)]"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${authInputClass} pr-[52px]`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[color:var(--color-primary-300)] hover:text-[color:var(--color-brand)] transition-colors duration-200 cursor-pointer ds-focus-ring rounded-[var(--radius-sm)]"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-[13px] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-brand)] transition-colors duration-200 cursor-pointer ds-focus-ring rounded-[var(--radius-sm)]"
                >
                  Forgot password ?
                </button>
              </div>
            </div>

            <FormButton type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </FormButton>

            <GoogleSignInButton />

            <LegalFooterLinks className="flex items-center justify-center gap-3 text-[11px] text-[color:var(--color-text-muted)] pt-2" />
          </form>
        </div>
      </AuthLayout>

      {showJiraAuth && (
        <JiraAuth
          onClose={finishAuth}
          onConnect={finishAuth}
          onSkip={finishAuth}
        />
      )}
    </>
  )
}
