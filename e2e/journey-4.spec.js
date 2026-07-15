import { test, expect } from '@playwright/test'
import { setupApprovedDeveloper, seedTask, signInViaUi, taskCardByTitle } from './helpers/api.mjs'

const ts = Date.now()
const PASSWORD = 'Password123!'
const ADMIN_EMAIL = `j4_admin_${ts}@e2e.test`
const DEV_EMAIL = `j4_dev_${ts}@e2e.test`
const SPRINT_NAME = `E2E Sprint ${ts}`

test('Journey 4 — admin creates sprint, closes sprint, developer sprint XP resets', async ({ page }) => {
  const { devUser, workspace } = await setupApprovedDeveloper({
    adminEmail: ADMIN_EMAIL,
    devEmail: DEV_EMAIL,
    adminUsername: `j4admin_${ts}`,
    devUsername: `j4dev_${ts}`,
    workspaceName: `Journey4 WS ${ts}`,
    password: PASSWORD,
  })

  await seedTask({
    workspaceId: workspace.id,
    developerId: devUser.id,
    title: 'Sprint XP Task',
    difficulty: 'medium',
    xpReward: 40,
  })

  await signInViaUi(page, { email: ADMIN_EMAIL, password: PASSWORD })
  await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })

  await page.getByRole('button', { name: 'Sprints' }).click()
  await page.getByPlaceholder('Sprint 1').fill(SPRINT_NAME)
  await page.getByRole('button', { name: /create sprint/i }).click()
  await expect(page.getByRole('heading', { name: SPRINT_NAME }).first()).toBeVisible({ timeout: 10000 })

  await signInViaUi(page, { email: DEV_EMAIL, password: PASSWORD, skipJira: true })
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  await page.goto('/tasks')
  const taskCard = taskCardByTitle(page, 'Sprint XP Task')
  await taskCard.getByRole('button', { name: /mark complete/i }).click()
  await expect(taskCard.getByRole('button', { name: /mark incomplete/i })).toBeVisible({ timeout: 10000 })

  await page.goto('/profile')
  const seasonScoreRow = page.locator('div.flex.items-center.justify-between').filter({ hasText: 'Season score' })
  await expect(seasonScoreRow.getByText('40 XP')).toBeVisible({ timeout: 10000 })

  await signInViaUi(page, { email: ADMIN_EMAIL, password: PASSWORD })
  await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
  await page.getByRole('button', { name: 'Sprints' }).click()
  await page.getByRole('button', { name: /close sprint/i }).click()
  await page.getByRole('button', { name: /confirm close/i }).click()

  await signInViaUi(page, { email: DEV_EMAIL, password: PASSWORD, skipJira: true })
  await page.goto('/profile')
  const seasonScoreRowAfter = page.locator('div.flex.items-center.justify-between').filter({ hasText: 'Season score' })
  await expect(seasonScoreRowAfter.getByText('0 XP')).toBeVisible({ timeout: 15000 })
})
