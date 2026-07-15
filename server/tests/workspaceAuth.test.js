const { isWorkspaceAdmin, canAccessWorkspace } = require('../lib/workspaceAuth')

describe('workspaceAuth', () => {
  const workspace = { id: 'ws-1', admin_id: 'admin-1' }

  test('isWorkspaceAdmin is true only for the workspace owner', () => {
    expect(isWorkspaceAdmin({ id: 'admin-1' }, workspace)).toBe(true)
    expect(isWorkspaceAdmin({ id: 'dev-1', workspace_id: 'ws-1' }, workspace)).toBe(false)
    expect(isWorkspaceAdmin(null, workspace)).toBe(false)
    expect(isWorkspaceAdmin({ id: 'admin-1' }, null)).toBe(false)
  })

  test('canAccessWorkspace allows owner or assigned member', () => {
    expect(canAccessWorkspace({ id: 'admin-1' }, workspace)).toBe(true)
    expect(canAccessWorkspace({ id: 'dev-1', workspace_id: 'ws-1' }, workspace)).toBe(true)
    expect(canAccessWorkspace({ id: 'dev-2', workspace_id: 'ws-other' }, workspace)).toBe(false)
    expect(canAccessWorkspace({ id: 'dev-3', workspace_id: null }, workspace)).toBe(false)
  })

  test('membership argument grants access when MULTI_WORKSPACE is on', () => {
    const prev = process.env.MULTI_WORKSPACE
    process.env.MULTI_WORKSPACE = 'true'
    const membership = { workspace_id: 'ws-1', status: 'active', role: 'developer' }
    expect(canAccessWorkspace({ id: 'dev-9', workspace_id: null }, workspace, membership)).toBe(
      true
    )
    expect(
      isWorkspaceAdmin(
        { id: 'co-admin' },
        workspace,
        { workspace_id: 'ws-1', status: 'active', role: 'admin' }
      )
    ).toBe(true)
    // Stale primary workspace_id must not grant access without active membership
    expect(
      canAccessWorkspace({ id: 'left-user', workspace_id: 'ws-1' }, workspace, null)
    ).toBe(false)
    if (prev === undefined) delete process.env.MULTI_WORKSPACE
    else process.env.MULTI_WORKSPACE = prev
  })
})
