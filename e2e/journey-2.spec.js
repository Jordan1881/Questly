import { test, expect } from '@playwright/test'
import { setupApprovedDeveloper, seedTask, seedReward, taskCardByTitle, waitForQuestXpAwarded, waitForPurchaseSuccess } from './helpers/api.mjs'

const ts = Date.now()
const PASSWORD = 'Password123!'
const ADMIN_EMAIL = `j2_admin_${ts}@e2e.test`
const DEV_EMAIL = `j2_dev_${ts}@e2e.test`
const COUPON_CODE = `E2E-COUPON-${ts}`
const EXPIRES_AT = '2026-12-31'

test('Journey 2 — earn XP, purchase reward, coupon in My Rewards', async ({ page }) => {
  const { adminUser, devUser, workspace } = await setupApprovedDeveloper({
    adminEmail: ADMIN_EMAIL,
    devEmail: DEV_EMAIL,
    adminUsername: `j2admin_${ts}`,
    devUsername: `j2dev_${ts}`,
    workspaceName: `Journey2 WS ${ts}`,
    password: PASSWORD,
  })

  await seedTask({
    workspaceId: workspace.id,
    developerId: devUser.id,
    title: 'Earn XP Task',
    difficulty: 'medium',
    xpReward: 40,
  })

  await seedReward({
    workspaceId: workspace.id,
    title: 'E2E Gift Card',
    coinCost: 4,
    couponCode: COUPON_CODE,
    expiresAt: EXPIRES_AT,
    createdBy: adminUser.id,
  })

  await page.goto('/login')
  await page.getByPlaceholder('Enter your email').fill(DEV_EMAIL)
  await page.getByPlaceholder('Password').fill(PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByRole('button', { name: /skip for now/i }).click({ timeout: 15000 })
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  await page.goto('/tasks')
  await expect(page.getByText('Earn XP Task')).toBeVisible({ timeout: 15000 })
  const taskCard = taskCardByTitle(page, 'Earn XP Task')
  await taskCard.getByRole('button', { name: /mark complete/i }).click()
  await waitForQuestXpAwarded(page, 40)

  await page.goto('/rewards')
  await expect(page.getByText('E2E Gift Card')).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: 'Buy' }).first().click()
  await page.getByRole('button', { name: /confirm|purchase/i }).click()
  await waitForPurchaseSuccess(page)

  await page.goto('/profile')
  await expect(page.getByText('E2E Gift Card')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/Dec 31, 2026|2026/)).toBeVisible({ timeout: 10000 })
})
