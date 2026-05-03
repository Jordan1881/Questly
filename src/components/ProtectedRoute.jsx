import { Navigate } from 'react-router'
import { useAuthStore } from '../stores/authStore'

// Guards protected routes.
// - If not logged in: redirect to /login
// - If requiredRole is set and the user's role doesn't match: redirect to their home page
export default function ProtectedRoute({ children, requiredRole }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const userRole = useAuthStore((s) => s.userRole)

  if (!isLoggedIn) return <Navigate to="/login" replace />

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return children
}
