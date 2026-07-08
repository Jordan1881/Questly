import logo from '../assets/LOGO.svg'
import FormButton from '../design-system/components/FormButton'
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
        className="ds-card ds-card-pad w-full max-w-[420px] flex flex-col gap-4 text-center shadow-[var(--shadow-lg)]"
        role="alertdialog"
        aria-labelledby="session-expired-title"
      >
        <img src={logo} alt="Questly" className="h-10 w-auto mx-auto" />
        <h2 id="session-expired-title" className="ds-section-title">
          Session expired
        </h2>
        <p className="ds-body">
          Your session has ended. Sign in again to continue using Questly.
        </p>
        <FormButton type="button" className="w-full" onClick={handleSignIn}>
          Sign in again
        </FormButton>
      </div>
    </div>
  )
}
