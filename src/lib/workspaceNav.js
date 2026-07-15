/** Multi-workspace navigation + identity helpers (T7). */

export function isMultiWorkspaceMode(authState) {
  return Array.isArray(authState?.memberships)
}

export function getShellRole(authState) {
  if (isMultiWorkspaceMode(authState) && authState.activeMembership?.role) {
    return authState.activeMembership.role
  }
  return authState?.userRole || 'developer'
}

export function roleHomePath(role, workspaceId = null) {
  const home = role === 'admin' ? 'admin' : 'dashboard'
  if (workspaceId) return `/w/${workspaceId}/${home}`
  return `/${home}`
}

export function pagePath(pageId, workspaceId = null) {
  const flat = {
    dashboard: '/dashboard',
    profile: '/profile',
    tasklist: '/tasks',
    rewardshop: '/rewards',
    shop: '/shop',
    settings: '/settings',
    admin: '/admin',
    workspace: '/workspace',
    workspacecreate: '/workspace/create',
    workspacejoin: '/workspace/join',
  }
  const path = flat[pageId]
  if (!path) return '/'
  // Keep onboarding create/join forms unscoped; hub `/workspace` is shell-scoped.
  if (!workspaceId || path.startsWith('/workspace/')) return path
  return `/w/${workspaceId}${path}`
}

export function sortMemberships(memberships) {
  return [...(memberships || [])].sort((a, b) => {
    const aTime = a.last_used_at ? new Date(a.last_used_at).getTime() : 0
    const bTime = b.last_used_at ? new Date(b.last_used_at).getTime() : 0
    if (bTime !== aTime) return bTime - aTime
    const aName = (a.workspace?.name || '').toLowerCase()
    const bName = (b.workspace?.name || '').toLowerCase()
    return aName.localeCompare(bName)
  })
}

/** Jira cue order: project key → site host → Not connected */
export function jiraIdentityCue(workspaceLike) {
  if (!workspaceLike) return 'Not connected'
  if (workspaceLike.jira_project_key) return workspaceLike.jira_project_key
  if (workspaceLike.team_jira_site_host) return workspaceLike.team_jira_site_host
  if (workspaceLike.jira_site_url) {
    try {
      return new URL(workspaceLike.jira_site_url).hostname
    } catch {
      return workspaceLike.jira_site_url
    }
  }
  if (workspaceLike.team_jira_connected || workspaceLike.jira_connected) {
    return 'Connected'
  }
  return 'Not connected'
}

export function pathMatchesPage(pathname, pageId, workspaceId = null) {
  return pathname === pagePath(pageId, workspaceId) || pathname === pagePath(pageId, null)
}
