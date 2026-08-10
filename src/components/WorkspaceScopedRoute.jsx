import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router'
import { useAuthStore } from '../stores/authStore'
import { roleHomePath } from '../lib/workspaceNav'

/**
 * Syncs URL /w/:workspaceId with auth active workspace.
 * Renders children when the membership is valid.
 */
export default function WorkspaceScopedRoute({ children }) {
  const { workspaceId } = useParams()
  const memberships = useAuthStore((s) => s.memberships)
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId)
  const setActiveWorkspace = useAuthStore((s) => s.setActiveWorkspace)

  const multi = Array.isArray(memberships)
  const membership = multi
    ? memberships.find((m) => m.workspace_id === workspaceId)
    : null

  useEffect(() => {
    if (!multi || !workspaceId || !membership) return
    if (activeWorkspaceId !== workspaceId) {
      setActiveWorkspace(workspaceId)
    }
  }, [multi, workspaceId, membership, activeWorkspaceId, setActiveWorkspace])

  if (!multi) {
    // Flag-off (or memberships not loaded yet): don't bounce admins off scoped URLs mid-load.
    // Flat routes + MultiWorkspaceRedirect handle the settled flag-on case.
    return children
  }

  if (!membership) {
    const fallbackId = activeWorkspaceId || memberships[0]?.workspace_id
    if (fallbackId) {
      return <Navigate to={roleHomePath(memberships.find((m) => m.workspace_id === fallbackId)?.role, fallbackId)} replace />
    }
    return <Navigate to="/workspace/join" replace />
  }

  return children
}
