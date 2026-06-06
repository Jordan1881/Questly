import { useState } from 'react'
import { useNavigate } from 'react-router'
import logoHorizontal from '../assets/LOGO-HORIZENTAL.svg'
import signUpImg from '../assets/signUp-img.png'
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

const inputClass = `
  w-full h-[56px] rounded-[8px] bg-[#f5eefd]
  border border-transparent
  px-5 text-[15px] text-black
  placeholder-[#a7a3ff]
  outline-none
  focus:border-[#942fcd] focus:border-opacity-40
  transition-colors duration-200
`

function PasswordInput({ placeholder, value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={inputClass}
        style={{ fontFamily: 'Inter, sans-serif', paddingRight: '52px' }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[#a7a3ff] hover:text-[#942fcd] transition-colors duration-200 cursor-pointer"
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
      if (selectedRole === 'developer') setShowJiraAuth(true)
      else navigate(await resolvePostAuthPath())
    }
  }

  const finishAuth = async () => {
    setShowJiraAuth(false)
    await fetchMe().catch(() => {})
    navigate(await resolvePostAuthPath())
  }

  return (
    <div className="min-h-screen bg-[#fbfbfb] flex items-start justify-center pt-[140px] pb-16 relative" style={{ fontFamily: 'Inter, sans-serif' }}>

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

        {/* ── Left: text + illustration ── */}
        <div className="flex-1 flex flex-col gap-8 relative">

          <div className="flex flex-col gap-4 max-w-[421px]">
            <h1 className="text-[48px] font-semibold text-black leading-[1.2] w-[235px]">
              Sign up to Questly
            </h1>
            <p className="text-[24px] font-medium text-black leading-[1.4] w-[397px]">
              Create your account and start turning tasks into quests
            </p>
          </div>

          <div className="flex flex-col gap-2 max-w-[421px]">
            <p className="text-[16px] text-black">If you already have an account</p>
            <p className="text-[16px] text-black">
              You can{' '}
              <span
                className="text-[#4d47c3] cursor-pointer hover:underline"
                onClick={() => navigate('/login')}
              >
                Login here !
              </span>
            </p>
          </div>

          {/* 3D illustration */}
          <img
            src={signUpImg}
            alt="Quest character"
            className="w-[280px] object-contain mt-4"
            style={{ height: 'auto' }}
          />

        </div>

        {/* ── Right: form card ── */}
        <div
          className="bg-white rounded-[16px] w-[440px] flex flex-col gap-8 pt-10 px-10 pb-10 shrink-0"
          style={{ boxShadow: '0px 8px 32px 0px rgba(148, 47, 205, 0.12)' }}
        >
          {/* Card header */}
          <div className="flex flex-col gap-2">
            <h2 className="text-[32px] font-medium text-black leading-tight">Create Your Account</h2>
            <p className="text-[14px] text-[#6b6b6b]">Start your journey with Questly today</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Error banner */}
            {(validationError || error) && (
              <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
                {validationError ?? error}
              </div>
            )}

            {/* Role toggle cards */}
            <div className="flex gap-3">
              {[
                { role: 'developer', label: 'Developer',      desc: 'Complete quests & earn XP', Icon: CodeBracketIcon },
                { role: 'admin',     label: 'Admin / Manager', desc: 'Manage your team & rewards', Icon: CrownIcon      },
              ].map(({ role, label, desc, Icon }) => {
                const active = selectedRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className="flex-1 flex flex-col items-center gap-2 rounded-[12px] py-4 px-3 border-2 text-center cursor-pointer transition-all duration-200"
                    style={{
                      borderColor: active ? '#942fcd' : '#e5e7eb',
                      background:  active ? 'rgba(148,47,205,0.06)' : 'white',
                      boxShadow:   active ? '0px 0px 0px 3px rgba(148,47,205,0.12)' : 'none',
                    }}
                  >
                    <div style={{ color: active ? '#942fcd' : '#9ca3af', transition: 'color 0.2s' }}>
                      <Icon />
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: active ? '#942fcd' : '#374151' }}>{label}</span>
                    <span className="text-[11px] text-[#9ca3af] leading-[1.4]">{desc}</span>
                  </button>
                )
              })}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-black">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
                className={inputClass}
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            {/* Username */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-black">Username</label>
              <input
                type="text"
                placeholder="Create a username"
                value={form.username}
                onChange={set('username')}
                required
                minLength={2}
                autoComplete="username"
                className={inputClass}
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-black">Password</label>
              <PasswordInput
                placeholder="Create a password"
                value={form.password}
                onChange={set('password')}
              />
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-black">Confirm Password</label>
              <PasswordInput
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
              />
            </div>

            {/* Submit */}
            <LegalAgreementText />

            <FormButton type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create Account'}
            </FormButton>

            {/* Bottom link */}
            <p className="text-[14px] text-[#6b6b6b] text-center">
              Already have an account?{' '}
              <span
                className="text-[#942fcd] cursor-pointer hover:underline"
                onClick={() => navigate('/login')}
              >
                Log in
              </span>
            </p>

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
