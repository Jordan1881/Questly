const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001'

export async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return data
}

export async function register({ email, username, password, role }) {
  await api('/api/auth/register', {
    method: 'POST',
    body: { email, username, password, role },
  })
  const { token, user } = await api('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  return { token, user }
}

export async function createWorkspace(token, name) {
  const { workspace } = await api('/api/workspaces', {
    method: 'POST',
    token,
    body: { name },
  })
  return workspace
}

export async function submitJoinRequest(token, workspaceId) {
  const { join_request } = await api(`/api/workspaces/${workspaceId}/join-requests`, {
    method: 'POST',
    token,
    body: {},
  })
  return join_request
}

export async function listPendingJoinRequests(token, workspaceId) {
  const { join_requests } = await api(`/api/workspaces/${workspaceId}/join-requests`, { token })
  return join_requests
}

export async function approveJoinRequest(token, workspaceId, requestId) {
  return api(`/api/workspaces/${workspaceId}/join-requests/${requestId}`, {
    method: 'PATCH',
    token,
    body: { status: 'approved' },
  })
}

export async function seedTask(body) {
  return api('/api/e2e/seed/task', { method: 'POST', body })
}

export async function seedReward(body) {
  return api('/api/e2e/seed/reward', { method: 'POST', body })
}
