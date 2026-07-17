import { test, expect } from '@playwright/test'
import { setupApprovedDeveloper, seedTask, reconcileAssignments, taskCardByTitle, waitForQuestXpAwarded } from './helpers/api.mjs'

const ts = Date.now()
const PASSWORD = 'Password123!'
const ADMIN_EMAIL = `j5_admin_${ts}@e2e.test`
const DEV_EMAIL = `j5_dev_${ts}@e2e.test`

test('Journey 5 — assignee sync adds task; remove assignee drops uncompleted assignment', async ({ page }) => {
  const { devUser, workspace } = await setupApprovedDeveloper({
    adminEmail: ADMIN_EMAIL,
    devEmail: DEV_EMAIL,
    adminUsername: `j5admin_${ts}`,
    devUsername: `j5dev_${ts}`,
    workspaceName: `Journey5 WS ${ts}`,
    password: PASSWORD,
  })

  const { task } = await seedTask({
    workspaceId: workspace.id,
    developerId: devUser.id,
    title: 'Assignee Sync Task',
    difficulty: 'easy',
    xpReward: 20,
    assign: false,
  })

  await page.goto('/login')
  await page.getByPlaceholder('Enter your email').fill(DEV_EMAIL)
  await page.getByPlaceholder('Password').fill(PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByRole('button', { name: /skip for now/i }).click({ timeout: 15000 })

  await page.goto('/tasks')
  await expect(page.getByText('Assignee Sync Task')).not.toBeVisible({ timeout: 5000 })

  await reconcileAssignments(task.id, [devUser.id])

  await page.reload()
  await expect(page.getByText('Assignee Sync Task')).toBeVisible({ timeout: 10000 })

  const taskCard = taskCardByTitle(page, 'Assignee Sync Task')
  await taskCard.getByRole('button', { name: /mark complete/i }).click()
  await waitForQuestXpAwarded(page, 20)
  await expect(taskCard.getByRole('button', { name: /mark incomplete/i })).toBeVisible({ timeout: 10000 })

  await reconcileAssignments(task.id, [])

  await page.reload()
  await expect(page.getByText('Assignee Sync Task')).toBeVisible({ timeout: 10000 })
})
