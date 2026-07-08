import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import JiraIntegrationCard from '../components/JiraIntegrationCard'
import { useAuthStore } from '../stores/authStore'
import { useProfileStore } from '../stores/profileStore'
import { parsePreferences } from '../lib/userPreferences'
import AnimatedReveal from '../components/motion/AnimatedReveal'

const fieldClass =
  'mt-1 w-full px-3 py-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] text-[length:var(--text-body-sm)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]/30'

function PasswordSection() {
  const changePassword = useAuthStore((s) => s.changePassword)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    setSaving(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage({ type: 'success', text: 'Password updated.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="ds-card ds-card-pad">
      <h2 className="ds-subsection-title mb-1">Security</h2>
      <p className="ds-body-sm mb-5">Change your account password.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <label className="text-[length:var(--text-caption)] font-medium text-[color:var(--color-gray-700)]">
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={fieldClass}
            required
          />
        </label>
        <label className="text-[length:var(--text-caption)] font-medium text-[color:var(--color-gray-700)]">
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={fieldClass}
            required
            minLength={8}
          />
        </label>
        <label className="text-[length:var(--text-caption)] font-medium text-[color:var(--color-gray-700)]">
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={fieldClass}
            required
            minLength={8}
          />
        </label>

        {message && (
          <p
            className={`text-[length:var(--text-caption)] ${
              message.type === 'success'
                ? 'text-[color:var(--color-success-600)]'
                : 'text-[color:var(--color-error-500)]'
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="self-start px-4 py-2 rounded-[var(--radius-md)] text-[length:var(--text-body-sm)] font-semibold text-white cursor-pointer disabled:opacity-60 ds-brand-gradient"
        >
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </section>
  )
}

function NotificationsSection() {
  const profile = useProfileStore((s) => s.profile)
  const fetchProfile = useProfileStore((s) => s.fetchProfile)
  const updatePreferences = useProfileStore((s) => s.updatePreferences)
  const authUser = useAuthStore((s) => s.user)
  const userRole = useAuthStore((s) => s.userRole)

  const prefs = parsePreferences(profile?.preferences ?? authUser?.preferences)
  const levelUpNotifications = prefs.levelUpNotifications
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile().catch(() => {})
  }, [fetchProfile])

  const handleToggle = async () => {
    const next = !levelUpNotifications
    setSaving(true)
    setMessage(null)

    try {
      await updatePreferences({ levelUpNotifications: next })
      setMessage({ type: 'success', text: 'Preferences saved.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (userRole === 'admin') {
    return (
      <section className="ds-card ds-card-pad">
        <h2 className="ds-subsection-title mb-1">Notifications</h2>
        <p className="ds-body-sm">Level-up celebrations apply to developer accounts completing quests.</p>
      </section>
    )
  }

  return (
    <section className="ds-card ds-card-pad">
      <h2 className="ds-subsection-title mb-1">Notifications</h2>
      <p className="ds-body-sm mb-5">Choose which in-app celebrations you want to see.</p>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={levelUpNotifications}
          onChange={handleToggle}
          disabled={saving}
          className="mt-1 h-4 w-4 accent-[color:var(--color-brand)]"
        />
        <span>
          <span className="block text-[length:var(--text-body-sm)] font-medium text-[color:var(--color-gray-800)]">
            Level-up celebrations
          </span>
          <span className="block text-[length:var(--text-caption)] text-[color:var(--color-gray-500)]">
            Show the level-up overlay when you earn enough XP to reach a new level.
          </span>
        </span>
      </label>

      {message && (
        <p
          className={`mt-3 text-[length:var(--text-caption)] ${
            message.type === 'success'
              ? 'text-[color:var(--color-success-600)]'
              : 'text-[color:var(--color-error-500)]'
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  )
}

function IntegrationsSection() {
  const userRole = useAuthStore((s) => s.userRole)

  return (
    <section className="ds-card ds-card-pad">
      <h2 className="ds-subsection-title mb-1">Integrations</h2>
      <p className="ds-body-sm mb-4">
        {userRole === 'admin'
          ? 'Manage your personal Jira link or configure team Jira sync.'
          : 'Connect your Jira account to receive assigned tasks in Questly.'}
      </p>

      {userRole === 'admin' && (
        <p className="text-[length:var(--text-caption)] text-[color:var(--color-gray-500)] mb-4">
          Team-wide Jira sync is configured in{' '}
          <Link to="/admin" className="font-semibold text-[color:var(--color-brand)] hover:underline">
            Admin
          </Link>
          .
        </p>
      )}

      <JiraIntegrationCard showConnectForm />
    </section>
  )
}

export default function Settings() {
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <div className="ds-page">
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      <PageHeader onOpenSidebar={() => setShowSidebar(true)} />

      <main className="ds-page-main">
        <AnimatedReveal className="flex flex-col gap-6 max-w-3xl">
          <div data-motion-reveal>
            <h1 className="text-[length:var(--text-h4)] font-bold text-[color:var(--color-gray-800)]">Settings</h1>
            <p className="ds-body-sm mt-1">Manage security, notifications, and integrations.</p>
          </div>

          <div data-motion-reveal>
            <PasswordSection />
          </div>
          <div data-motion-reveal>
            <NotificationsSection />
          </div>
          <div data-motion-reveal>
            <IntegrationsSection />
          </div>
        </AnimatedReveal>
      </main>
    </div>
  )
}
