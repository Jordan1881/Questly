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
  const user = useAuthStore((s) => s.user)
  const memberships = useAuthStore((s) => s.memberships)
  const activeMembership = useAuthStore((s) => s.activeMembership)
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  const multi = Array.isArray(memberships)
  const shellRole = getShellRole({ memberships, activeMembership, userRole })

  useEffect(() => {
    if (isLoggedIn) {
      fetchMe().catch(() => {
        useXpStore.getState().syncFromUser(user)
      })
    }
  }, [isLoggedIn, fetchMe, user])

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
