import { describe, it, expect } from 'vitest'
import {
  getShellRole,
  jiraIdentityCue,
  pagePath,
  roleHomePath,
  sortMemberships,
} from '../../lib/workspaceNav'

describe('workspaceNav', () => {
  it('builds workspace-scoped role homes', () => {
    expect(roleHomePath('admin', 'ws-1')).toBe('/w/ws-1/admin')
    expect(roleHomePath('developer', 'ws-1')).toBe('/w/ws-1/dashboard')
    expect(roleHomePath('admin')).toBe('/admin')
  })

  it('scopes page paths when workspace id is present', () => {
    expect(pagePath('dashboard', 'ws-9')).toBe('/w/ws-9/dashboard')
    expect(pagePath('workspace', 'ws-9')).toBe('/w/ws-9/workspace')
    expect(pagePath('workspacecreate', 'ws-9')).toBe('/workspace/create')
  })

  it('uses membership role for shell chrome when multi', () => {
    expect(
      getShellRole({
        memberships: [],
        activeMembership: { role: 'admin' },
        userRole: 'developer',
      }),
    ).toBe('admin')
  })

  it('sorts by last_used then name', () => {
    const sorted = sortMemberships([
      { workspace_id: 'b', last_used_at: null, workspace: { name: 'Beta' } },
      { workspace_id: 'a', last_used_at: '2026-01-02T00:00:00Z', workspace: { name: 'Alpha' } },
      { workspace_id: 'c', last_used_at: '2026-01-01T00:00:00Z', workspace: { name: 'Charlie' } },
    ])
    expect(sorted.map((m) => m.workspace_id)).toEqual(['a', 'c', 'b'])
  })

  it('formats jira identity cue in priority order', () => {
    expect(jiraIdentityCue({ jira_project_key: 'QUEST', team_jira_site_host: 'x.atlassian.net' })).toBe(
      'QUEST',
    )
    expect(jiraIdentityCue({ team_jira_site_host: 'x.atlassian.net' })).toBe('x.atlassian.net')
    expect(jiraIdentityCue({})).toBe('Not connected')
  })
})
