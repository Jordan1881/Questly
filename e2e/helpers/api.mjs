import { expect } from '@playwright/test'

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

/** Register admin + dev, approve join — common setup for journey specs. */
export async function setupApprovedDeveloper({
  adminEmail,
  devEmail,
  adminUsername,
  devUsername,
  workspaceName,
  password = 'Password123!',
}) {
  const { token: adminToken, user: adminUser } = await register({
    email: adminEmail,
    username: adminUsername,
    password,
    role: 'admin',
  })
  const workspace = await createWorkspace(adminToken, workspaceName)
  const { token: devToken, user: devUser } = await register({
    email: devEmail,
    username: devUsername,
    password,
    role: 'developer',
  })
  const joinRequest = await submitJoinRequest(devToken, workspace.id)
  const pending = await listPendingJoinRequests(adminToken, workspace.id)
  await approveJoinRequest(adminToken, workspace.id, pending[0]?.id || joinRequest.id)

  return { adminToken, adminUser, devToken, devUser, workspace, password }
}

export async function seedTask(body) {
  return api('/api/e2e/seed/task', { method: 'POST', body })
}

export async function seedWorkspaceJira({ workspaceId, jira_site_url, jira_project_key }) {
  return api('/api/e2e/seed/workspace-jira', {
    method: 'POST',
    body: { workspaceId, jira_site_url, jira_project_key },
  })
}

export async function seedReward(body) {
  return api('/api/e2e/seed/reward', { method: 'POST', body })
}

export async function reconcileAssignments(taskId, developerIds) {
  return api('/api/e2e/seed/reconcile-assignments', {
    method: 'POST',
    body: { taskId, developerIds },
  })
}

export async function createSprint(token, workspaceId, body) {
  const { sprint } = await api(`/api/workspaces/${workspaceId}/sprints`, {
    method: 'POST',
    token,
    body,
  })
  return sprint
}

export async function closeSprint(token, sprintId) {
  const { sprint } = await api(`/api/sprints/${sprintId}/close`, {
    method: 'POST',
    token,
  })
  return sprint
}

export const SIGN_IN_EMAIL_PLACEHOLDER = 'Enter your email'

/** Locate a TaskCard root by task title (matches ds-card wrapper from design-system). */
export function taskCardByTitle(page, title) {
  return page
    .getByRole('heading', { name: title, exact: true })
    .locator('xpath=ancestor::div[contains(@class,"ds-card")]')
    .first()
}

/**
 * Wait for quest completion to persist. Optimistic UI flips the button immediately,
 * so callers must not navigate until this toast appears or the request is aborted.
 */
export async function waitForQuestXpAwarded(page, xp) {
  await expect(page.getByRole('status')).toContainText(new RegExp(`\\+${xp}\\s*XP`, 'i'), {
    timeout: 15000,
  })
}

/** Wait for reward purchase to persist before navigating away. */
export async function waitForPurchaseSuccess(page) {
  await expect(page.getByRole('status')).toContainText(/purchased/i, { timeout: 15000 })
}

/** Clear persisted auth and sign in via the login form. */
export async function signInViaUi(page, { email, password, skipJira = false }) {
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByPlaceholder(SIGN_IN_EMAIL_PLACEHOLDER).fill(email)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  if (skipJira) {
    await page.getByRole('button', { name: /skip for now/i }).click({ timeout: 15000 })
  }
}
