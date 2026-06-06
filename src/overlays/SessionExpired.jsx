import { useAuthStore } from '../stores/authStore'

export default function SessionExpired() {
  const sessionExpired = useAuthStore((s) => s.sessionExpired)
  const clearSessionExpired = useAuthStore((s) => s.clearSessionExpired)

  if (!sessionExpired) return null

  const handleSignIn = () => {
    clearSessionExpired()
    window.location.assign('/login')
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-6">
      <div
        className="bg-white rounded-[16px] w-full max-w-[420px] p-8 flex flex-col gap-4 text-center"
        style={{ boxShadow: '0px 8px 32px rgba(0,0,0,0.15)' }}
        role="alertdialog"
        aria-labelledby="session-expired-title"
      >
        <h2 id="session-expired-title" className="text-[22px] font-semibold text-[#1f2937]">
          Session expired
        </h2>
        <p className="text-[15px] text-[#6b7280]">
          Your session has ended. Sign in again to continue using Questly.
        </p>
        <button
          type="button"
          onClick={handleSignIn}
          className="w-full h-12 rounded-[8px] text-[15px] font-semibold text-white cursor-pointer"
          style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
        >
          Sign in again
        </button>
      </div>
    </div>
  )
}
