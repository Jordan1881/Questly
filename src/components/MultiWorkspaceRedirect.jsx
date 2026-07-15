import { Navigate, useLocation } from 'react-router'
import { useAuthStore } from '../stores/authStore'
import { pagePath } from '../lib/workspaceNav'

/**
 * When multi-workspace is on and an active workspace exists, bounce flat app
 * routes (/dashboard, /admin, …) to /w/:workspaceId/...
 */
export default function MultiWorkspaceRedirect({ pageId, children }) {
  const { pathname } = useLocation()
  const memberships = useAuthStore((s) => s.memberships)
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId)

  if (Array.isArray(memberships) && activeWorkspaceId && !pathname.startsWith('/w/')) {
    return <Navigate to={pagePath(pageId, activeWorkspaceId)} replace />
  }

  return children
}
