import { useState } from 'react'
import { useNavigate } from 'react-router'
import logoHorizontal from '../assets/LOGO-HORIZENTAL.svg'
import FormButton from '../design-system/components/FormButton'
import LegalFooterLinks from '../components/LegalFooterLinks'
import JiraAuth from '../overlays/JiraAuth'
import { useAuthStore } from '../stores/authStore'
import { resolvePostAuthPath } from '../lib/authRedirect'

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

const inputClass = `
  w-full h-[56px] rounded-[8px] bg-[#f5eefd]
  border border-transparent
  px-5 text-[15px] text-black
  placeholder-[#a7a3ff]
  outline-none
  focus:border-[#942fcd] focus:border-opacity-40
  transition-colors duration-200
`

export default function SignIn() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError, sessionExpired, clearSessionExpired } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showJiraAuth, setShowJiraAuth] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    clearSessionExpired()
    const result = await login({ email, password })
    if (result.ok) {
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
    <div className="min-h-screen bg-[#fbfbfb] flex items-center justify-center relative" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Logo — top left */}
      <img
        src={logoHorizontal}
        alt="Questly"
        className="absolute top-[60px] left-[75px] w-[180px] cursor-pointer"
        onClick={() => navigate('/')}
        style={{ height: 'auto' }}
      />

      {/* Main layout */}
      <div className="flex items-center justify-between w-[941px]">

        {/* ── Left: text ── */}
        <div className="flex flex-col gap-8 max-w-[421px]">

          <div className="flex flex-col gap-4">
            <h1 className="text-[48px] font-semibold text-black leading-[1.2]">
              Sign in to Questly
            </h1>
            <p className="text-[24px] font-medium text-black leading-[1.4] w-[418px]">
              Log in to continue managing your tasks and progress
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[16px] text-black">Don't have an account yet?</p>
            <p className="text-[16px] text-black">
              You can{' '}
              <span
                className="text-[#4d47c3] cursor-pointer hover:underline"
                onClick={() => navigate('/signup')}
              >
                Register here !
              </span>
            </p>
          </div>

        </div>

        {/* ── Right: form card ── */}
        <div
          className="bg-white rounded-[16px] w-[440px] flex flex-col gap-8 pt-10 px-10 pb-10"
          style={{ boxShadow: '0px 8px 32px 0px rgba(148, 47, 205, 0.12)' }}
        >
          <h2 className="text-[32px] font-medium text-black leading-tight">Sign in</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">

            {sessionExpired && (
              <div className="rounded-[8px] bg-amber-50 border border-amber-200 px-4 py-3 text-[13px] text-amber-800">
                Your session expired. Please sign in again.
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
                {error}
              </div>
            )}

            {/* Email / Username */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-black">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputClass}
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-black">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  style={{ fontFamily: 'Inter, sans-serif', paddingRight: '52px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[#a7a3ff] hover:text-[#942fcd] transition-colors duration-200 cursor-pointer"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <div className="flex justify-end">
                <span className="text-[13px] text-[#b0b0b0] cursor-pointer hover:text-[#942fcd] transition-colors duration-200">
                  Forgot password ?
                </span>
              </div>
            </div>

            {/* Submit */}
            <FormButton type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </FormButton>

            <LegalFooterLinks className="flex items-center justify-center gap-3 text-[11px] text-[#9ca3af] pt-2" />

          </form>
        </div>
      </div>

      {showJiraAuth && (
        <JiraAuth
          onClose={finishAuth}
          onConnect={finishAuth}
          onSkip={finishAuth}
        />
      )}

    </div>
  )
}
