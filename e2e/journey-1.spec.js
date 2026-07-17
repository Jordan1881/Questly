import { test, expect } from '@playwright/test'
import {
  register,
  createWorkspace,
  submitJoinRequest,
  listPendingJoinRequests,
  approveJoinRequest,
  seedTask,
  seedWorkspaceJira,
  taskCardByTitle,
  waitForQuestXpAwarded,
} from './helpers/api.mjs'

const ts = Date.now()
const PASSWORD = 'Password123!'
const ADMIN_EMAIL = `j1_admin_${ts}@e2e.test`
const DEV_EMAIL = `j1_dev_${ts}@e2e.test`
const TEAM_JIRA_SITE = 'https://questly-e2e.atlassian.net'

test('Journey 1 — join workspace, team Jira banner, complete task, XP on dashboard', async ({ page }) => {
  const { token: adminToken } = await register({
    email: ADMIN_EMAIL,
    username: `j1admin_${ts}`,
    password: PASSWORD,
    role: 'admin',
  })
  const workspace = await createWorkspace(adminToken, `Journey1 WS ${ts}`)

  await seedWorkspaceJira({
    workspaceId: workspace.id,
    jira_site_url: TEAM_JIRA_SITE,
    jira_project_key: 'QUEST',
  })

  const { token: devToken, user: devUser } = await register({
    email: DEV_EMAIL,
    username: `j1dev_${ts}`,
    password: PASSWORD,
    role: 'developer',
  })

  const joinRequest = await submitJoinRequest(devToken, workspace.id)
  const pending = await listPendingJoinRequests(adminToken, workspace.id)
  await approveJoinRequest(adminToken, workspace.id, pending[0]?.id || joinRequest.id)

  await seedTask({
    workspaceId: workspace.id,
    developerId: devUser.id,
    title: 'E2E Journey Task',
    difficulty: 'medium',
    xpReward: 40,
  })

  await page.goto('/login')
  await page.getByPlaceholder('Enter your email').fill(DEV_EMAIL)
  await page.getByPlaceholder('Password').fill(PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByRole('button', { name: /skip for now/i }).click({ timeout: 15000 })
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  await expect(page.getByText('questly-e2e.atlassian.net')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/connect your Jira account in Settings/i)).toBeVisible()

  await page.goto('/tasks')
  await expect(page.getByText('E2E Journey Task')).toBeVisible({ timeout: 10000 })

  const taskCard = taskCardByTitle(page, 'E2E Journey Task')
  await taskCard.getByRole('button', { name: /mark complete/i }).click()
  await waitForQuestXpAwarded(page, 40)

  await page.goto('/dashboard')
  await expect(page.getByText('completed').first()).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('1').first()).toBeVisible({ timeout: 10000 })
})
