import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import signUpImg from '../assets/signUp-img.png'
import AuthLayout, { authInputClass } from '../components/layout/AuthLayout'
import FormButton from '../design-system/components/FormButton'
import { LegalAgreementText } from '../components/LegalFooterLinks'
import JiraAuth from '../overlays/JiraAuth'
import { useAuthStore } from '../stores/authStore'
import { resolvePostAuthPath } from '../lib/authRedirect'

const MIN_PASSWORD_LENGTH = 8

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

function PasswordInput({ placeholder, value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${authInputClass} pr-[52px]`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[color:var(--color-primary-300)] hover:text-[color:var(--color-brand)] transition-colors duration-200 cursor-pointer ds-focus-ring rounded-[var(--radius-sm)]"
      >
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

const CodeBracketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CrownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M3 17l2-8 5 4 4-8 4 8 2-4-1 8H3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function SignUp() {
  const navigate = useNavigate()
  const { register, fetchMe, isLoading, error, clearError } = useAuthStore()
  const [form, setForm] = useState({ email: '', username: '', password: '', confirmPassword: '' })
  const [selectedRole, setSelectedRole] = useState('developer')
  const [showJiraAuth, setShowJiraAuth] = useState(false)
  const [validationError, setValidationError] = useState(null)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError(null)
    clearError()

    const email = form.email.trim()
    const username = form.username.trim()

    if (!email || !username || !form.password || !form.confirmPassword) {
      setValidationError('All fields are required')
      return
    }
    if (username.length < 2) {
      setValidationError('Username must be at least 2 characters')
      return
    }
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }
    if (form.password !== form.confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }

    const result = await register({
      email,
      username,
      password: form.password,
      role: selectedRole,
    })
    if (result.ok) {
      await fetchMe().catch(() => {})
      const jiraConnected = useAuthStore.getState().user?.jira_connected
      if (selectedRole === 'developer' && !jiraConnected) setShowJiraAuth(true)
      else navigate(await resolvePostAuthPath())
    }
  }

  const finishAuth = async () => {
    setShowJiraAuth(false)
    await fetchMe().catch(() => {})
    navigate(await resolvePostAuthPath())
  }

  return (
    <>
      <AuthLayout
        className="items-start pt-[140px] pb-16"
        title="Sign up to Questly"
        subtitle="Create your account and start turning tasks into quests"
        footer={
          <>
            <p>If you already have an account</p>
            <p>
              You can{' '}
              <Link
                to="/login"
                className="text-[color:var(--color-primary-700)] hover:underline ds-focus-ring rounded-[var(--radius-sm)]"
              >
                Login here !
              </Link>
            </p>
          </>
        }
        leftExtra={
          <img
            src={signUpImg}
            alt="Quest character"
            className="w-[280px] object-contain mt-4"
          />
        }
      >
        <div className="ds-card ds-card-pad w-[440px] flex flex-col gap-8 shrink-0 shadow-[var(--shadow-lg)]">
          <div className="flex flex-col gap-2">
            <h2 className="text-[32px] font-medium text-[color:var(--color-gray-900)] leading-tight">Create Your Account</h2>
            <p className="ds-body-sm">Start your journey with Questly today</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {(validationError || error) && (
              <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
                {validationError ?? error}
              </div>
            )}

            <div className="flex gap-3">
              {[
                { role: 'developer', label: 'Developer', desc: 'Complete quests & earn XP', Icon: CodeBracketIcon },
                { role: 'admin', label: 'Admin / Manager', desc: 'Manage your team & rewards', Icon: CrownIcon },
              ].map(({ role, label, desc, Icon }) => {
                const active = selectedRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`flex-1 flex flex-col items-center gap-2 rounded-[12px] py-4 px-3 border-2 text-center cursor-pointer transition-all duration-200 ds-focus-ring ${
                      active
                        ? 'border-[color:var(--color-brand)] bg-[color:var(--color-bg-brand-subtle)] shadow-[var(--focus-ring)]'
                        : 'border-[color:var(--color-border)] bg-[color:var(--color-bg)]'
                    }`}
                  >
                    <div className={active ? 'text-[color:var(--color-brand)]' : 'text-[color:var(--color-text-muted)]'}>
                      <Icon />
                    </div>
                    <span className={`text-[13px] font-semibold ${active ? 'text-[color:var(--color-brand)]' : 'text-[color:var(--color-gray-700)]'}`}>
                      {label}
                    </span>
                    <span className="text-[11px] text-[color:var(--color-text-muted)] leading-[1.4]">{desc}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[color:var(--color-gray-900)]">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
                className={authInputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[color:var(--color-gray-900)]">Username</label>
              <input
                type="text"
                placeholder="Create a username"
                value={form.username}
                onChange={set('username')}
                required
                minLength={2}
                autoComplete="username"
                className={authInputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[color:var(--color-gray-900)]">Password</label>
              <PasswordInput
                placeholder="Create a password"
                value={form.password}
                onChange={set('password')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[color:var(--color-gray-900)]">Confirm Password</label>
              <PasswordInput
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
              />
            </div>

            <LegalAgreementText />

            <FormButton type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create Account'}
            </FormButton>

            <p className="ds-body-sm text-center">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[color:var(--color-brand)] hover:underline ds-focus-ring rounded-[var(--radius-sm)]"
              >
                Log in
              </Link>
            </p>
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
