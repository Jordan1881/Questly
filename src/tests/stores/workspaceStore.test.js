import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { apiFetch } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}))

const RESET = {
  workspace: null,
  joinRequest: null,
  members: [],
  pendingJoinRequests: [],
  lastJiraSyncAt: null,
  lastJiraSyncResult: null,
  isLoading: false,
  error: null,
}

describe('workspaceStore', () => {
  beforeEach(() => {
    useWorkspaceStore.setState(RESET)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('createWorkspace stores workspace on success', async () => {
    apiFetch.mockResolvedValue({ workspace: { id: 'ws-1', name: 'Acme', code: 'ABCD1234' } })

    const workspace = await useWorkspaceStore.getState().createWorkspace('Acme')

    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme' }),
    })
    expect(workspace.code).toBe('ABCD1234')
    expect(useWorkspaceStore.getState().workspace.id).toBe('ws-1')
  })

  it('submitJoinRequest stores pending join request', async () => {
    apiFetch.mockResolvedValue({
      join_request: { id: 'jr-1', workspace_id: 'ws-1', status: 'pending' },
    })

    const joinRequest = await useWorkspaceStore.getState().submitJoinRequest('ws-1')

    expect(joinRequest.status).toBe('pending')
    expect(useWorkspaceStore.getState().joinRequest.id).toBe('jr-1')
  })

  it('reviewJoinRequest removes request from pending list', async () => {
    useWorkspaceStore.setState({
      pendingJoinRequests: [{ id: 'jr-1', username: 'dev1' }],
    })
    apiFetch.mockResolvedValue({ join_request: { id: 'jr-1', status: 'approved' } })

    await useWorkspaceStore.getState().reviewJoinRequest('ws-1', 'jr-1', 'approved')

    expect(useWorkspaceStore.getState().pendingJoinRequests).toHaveLength(0)
  })

  it('fetchMine stores admin workspace', async () => {
    apiFetch.mockResolvedValue({ workspace: { id: 'ws-1', name: 'Acme' } })
    const workspace = await useWorkspaceStore.getState().fetchMine()
    expect(workspace.id).toBe('ws-1')
  })

  it('lookupByCode resolves workspace by code', async () => {
    apiFetch.mockResolvedValue({ workspace: { id: 'ws-2', code: 'CODE1234' } })
    const workspace = await useWorkspaceStore.getState().lookupByCode('code1234')
    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/by-code/CODE1234')
    expect(workspace.code).toBe('CODE1234')
  })

  it('fetchMyJoinRequest stores pending request', async () => {
    apiFetch.mockResolvedValue({ join_request: { id: 'jr-2', status: 'pending' } })
    const joinRequest = await useWorkspaceStore.getState().fetchMyJoinRequest()
    expect(joinRequest.status).toBe('pending')
  })

  it('fetchPendingJoinRequests stores list', async () => {
    apiFetch.mockResolvedValue({ join_requests: [{ id: 'jr-3' }] })
    const list = await useWorkspaceStore.getState().fetchPendingJoinRequests('ws-1')
    expect(list).toHaveLength(1)
  })

  it('fetchMembers stores members', async () => {
    apiFetch.mockResolvedValue({ members: [{ id: 'u-1' }] })
    const members = await useWorkspaceStore.getState().fetchMembers('ws-1')
    expect(members[0].id).toBe('u-1')
  })

  it('createWorkspace sets error on failure', async () => {
    apiFetch.mockRejectedValue(new Error('Forbidden'))
    await expect(useWorkspaceStore.getState().createWorkspace('X')).rejects.toThrow('Forbidden')
    expect(useWorkspaceStore.getState().error).toBe('Forbidden')
  })

  it('clearError resets error', () => {
    useWorkspaceStore.setState({ error: 'failed' })
    useWorkspaceStore.getState().clearError()
    expect(useWorkspaceStore.getState().error).toBeNull()
  })

  it('syncJiraTasks stores sync result and timestamp', async () => {
    apiFetch.mockResolvedValue({ synced: 4, created: 2, updated: 2, assignments: 6 })

    const result = await useWorkspaceStore.getState().syncJiraTasks('ws-1')

    expect(apiFetch).toHaveBeenCalledWith('/api/tasks/sync/ws-1', { method: 'POST' })
    expect(result.synced).toBe(4)
    expect(useWorkspaceStore.getState().lastJiraSyncResult.created).toBe(2)
    expect(useWorkspaceStore.getState().lastJiraSyncAt).toBeTruthy()
  })

  it('connectJira stores connected workspace', async () => {
    apiFetch.mockResolvedValue({
      workspace: { id: 'ws-1', jira_connected: true, jira_site_url: 'https://acme.atlassian.net' },
    })

    const workspace = await useWorkspaceStore.getState().connectJira('ws-1', {
      jira_site_url: 'https://acme.atlassian.net',
      jira_project_key: 'QUEST',
      access_token: 'token',
    })

    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/ws-1/jira/connect', {
      method: 'POST',
      body: JSON.stringify({
        jira_site_url: 'https://acme.atlassian.net',
        jira_project_key: 'QUEST',
        access_token: 'token',
      }),
    })
    expect(workspace.jira_connected).toBe(true)
  })

  it('disconnectJira clears workspace Jira connection', async () => {
    useWorkspaceStore.setState({
      workspace: { id: 'ws-1', jira_connected: true },
    })
    apiFetch.mockResolvedValue({ workspace: { id: 'ws-1', jira_connected: false } })

    const workspace = await useWorkspaceStore.getState().disconnectJira('ws-1')

    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/ws-1/jira/disconnect', {
      method: 'DELETE',
    })
    expect(workspace.jira_connected).toBe(false)
  })

  it('connectJira sets error on failure', async () => {
    apiFetch.mockRejectedValue(new Error('Invalid Jira credentials'))
    await expect(
      useWorkspaceStore.getState().connectJira('ws-1', {
        jira_site_url: 'https://acme.atlassian.net',
        jira_project_key: 'QUEST',
        access_token: 'bad',
      }),
    ).rejects.toThrow('Invalid Jira credentials')
    expect(useWorkspaceStore.getState().error).toBe('Invalid Jira credentials')
  })

  it('disconnectJira sets error on failure', async () => {
    apiFetch.mockRejectedValue(new Error('Forbidden'))
    await expect(useWorkspaceStore.getState().disconnectJira('ws-1')).rejects.toThrow('Forbidden')
    expect(useWorkspaceStore.getState().error).toBe('Forbidden')
  })
})
