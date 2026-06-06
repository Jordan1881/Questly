import { useEffect } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '../stores/authStore'
import { useXpStore } from '../stores/xpStore'
import { useJiraOAuthCallback } from '../hooks/useJiraOAuthCallback'

// Guards protected routes.
// - If not logged in: redirect to /login
// - If requiredRole is set and the user's role doesn't match: redirect to their home page
export default function ProtectedRoute({ children, requiredRole }) {
  useJiraOAuthCallback()

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const userRole = useAuthStore((s) => s.userRole)
  const user = useAuthStore((s) => s.user)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  useEffect(() => {
    if (isLoggedIn) {
      fetchMe().catch(() => {
        useXpStore.getState().syncFromUser(user)
      })
    }
  }, [isLoggedIn, fetchMe, user])

  if (!isLoggedIn) return <Navigate to="/login" replace />

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return children
}
