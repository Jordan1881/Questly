import { test, expect } from '@playwright/test'
import {
  register,
  createWorkspace,
  submitJoinRequest,
  listPendingJoinRequests,
  approveJoinRequest,
  seedTask,
  reconcileAssignments,
} from './helpers/api.mjs'

const ts = Date.now()
const PASSWORD = 'Password123!'
const ADMIN_EMAIL = `j5_admin_${ts}@e2e.test`
const DEV_EMAIL = `j5_dev_${ts}@e2e.test`

test('Journey 5 — assignee sync adds task; remove assignee drops uncompleted assignment', async ({ page }) => {
  const { token: adminToken } = await register({
    email: ADMIN_EMAIL,
    username: `j5admin_${ts}`,
    password: PASSWORD,
    role: 'admin',
  })
  const workspace = await createWorkspace(adminToken, `Journey5 WS ${ts}`)

  const { token: devToken, user: devUser } = await register({
    email: DEV_EMAIL,
    username: `j5dev_${ts}`,
    password: PASSWORD,
    role: 'developer',
  })

  const joinRequest = await submitJoinRequest(devToken, workspace.id)
  const pending = await listPendingJoinRequests(adminToken, workspace.id)
  await approveJoinRequest(adminToken, workspace.id, pending[0]?.id || joinRequest.id)

  const { task } = await seedTask({
    workspaceId: workspace.id,
    developerId: devUser.id,
    title: 'Assignee Sync Task',
    difficulty: 'easy',
    xpReward: 20,
    assign: false,
  })

  await page.goto('/login')
  await page.getByPlaceholder('Enter email or user name').fill(DEV_EMAIL)
  await page.getByPlaceholder('Password').fill(PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByRole('button', { name: /skip for now/i }).click({ timeout: 15000 })

  await page.goto('/tasks')
  await expect(page.getByText('Assignee Sync Task')).not.toBeVisible({ timeout: 5000 })

  await reconcileAssignments(task.id, [devUser.id])

  await page.reload()
  await expect(page.getByText('Assignee Sync Task')).toBeVisible({ timeout: 10000 })

  const taskCard = page.locator('text=Assignee Sync Task').locator('xpath=ancestor::div[contains(@class,"rounded")]').first()
  await taskCard.getByRole('button', { name: /mark complete/i }).click()
  await expect(taskCard.getByRole('button', { name: /mark incomplete/i })).toBeVisible({ timeout: 10000 })

  await reconcileAssignments(task.id, [])

  await page.reload()
  await expect(page.getByText('Assignee Sync Task')).toBeVisible({ timeout: 10000 })
})
