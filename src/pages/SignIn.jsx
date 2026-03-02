import { useState } from 'react'
import logoHorizontal from '../assets/LOGO-HORIZENTAL.svg'
import FormButton from '../design-system/components/FormButton'

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

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-6" fill="white">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[15px] h-[28px]" fill="white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
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

export default function SignIn({ onNavigate, onSuccess }) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSuccess?.()
  }

  return (
    <div className="min-h-screen bg-[#fbfbfb] flex items-center justify-center relative" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Logo — top left */}
      <img
        src={logoHorizontal}
        alt="Questly"
        className="absolute top-[60px] left-[75px] w-[180px] cursor-pointer"
        onClick={() => onNavigate?.('hero')}
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
                onClick={() => onNavigate?.('signup')}
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

            {/* Email / Username */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-black">Email or Username</label>
              <input
                type="text"
                placeholder="Enter email or user name"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            <FormButton type="submit" className="w-full">
              Sign in
            </FormButton>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-[#e5e5e5]" />
              <span className="text-[14px] text-[#b5b5b5] whitespace-nowrap">or continue with</span>
              <div className="flex-1 h-px bg-[#e5e5e5]" />
            </div>

            {/* Social buttons */}
            <div className="flex items-center justify-center gap-4">

              {/* Google */}
              <button
                type="button"
                className="w-14 h-14 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow duration-200"
              >
                <GoogleIcon />
              </button>

              {/* Apple */}
              <button
                type="button"
                className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity duration-200"
                style={{ background: '#283544' }}
              >
                <AppleIcon />
              </button>

              {/* Facebook */}
              <button
                type="button"
                className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity duration-200"
                style={{ background: 'linear-gradient(to bottom, #18acfe, #0163e0)' }}
              >
                <FacebookIcon />
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
