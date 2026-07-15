import { useEffect } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '../stores/authStore'
import { useXpStore } from '../stores/xpStore'
import { useJiraOAuthCallback } from '../hooks/useJiraOAuthCallback'
import { getShellRole, roleHomePath } from '../lib/workspaceNav'

// Guards protected routes.
// - If not logged in: redirect to /login
// - If requiredRole is set and the user's shell role doesn't match: redirect to their home page
// - skipRoleWhenMulti: allow any logged-in user when MULTI_WORKSPACE memberships are present
export default function ProtectedRoute({ children, requiredRole, skipRoleWhenMulti = false }) {
  useJiraOAuthCallback()

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const userRole = useAuthStore((s) => s.userRole)
  const memberships = useAuthStore((s) => s.memberships)
  const activeMembership = useAuthStore((s) => s.activeMembership)
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  const multi = Array.isArray(memberships)
  const shellRole = getShellRole({ memberships, activeMembership, userRole })

  // Refresh session once on login — do NOT depend on `user`.
  // fetchMe() always writes a new user object, which would re-trigger this
  // effect and cause an infinite /me loop (Admin/Dashboard UI twitch).
  useEffect(() => {
    if (!isLoggedIn) return undefined
    let cancelled = false
    fetchMe().catch(() => {
      if (cancelled) return
      useXpStore.getState().syncFromUser(useAuthStore.getState().user)
    })
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, fetchMe])

  if (!isLoggedIn) return <Navigate to="/login" replace />

  const skipRole = skipRoleWhenMulti && multi
  if (requiredRole && !skipRole && shellRole !== requiredRole) {
    return (
      <Navigate
        to={roleHomePath(shellRole, multi ? activeWorkspaceId : null)}
        replace
      />
    )
  }

  return children
}
