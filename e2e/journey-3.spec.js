import { test, expect } from '@playwright/test'
import { setupApprovedDeveloper, seedTask, seedReward, taskCardByTitle } from './helpers/api.mjs'

const ts = Date.now()
const PASSWORD = 'Password123!'
const ADMIN_EMAIL = `j3_admin_${ts}@e2e.test`
const DEV_EMAIL = `j3_dev_${ts}@e2e.test`
const COUPON_CODE = `E2E-EXP-${ts}`

function expiringSoonDate() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 14)
  return d.toISOString().slice(0, 10)
}

test('Journey 3 — purchase reward, expiry warning, delete coupon', async ({ page }) => {
  const { adminUser, devUser, workspace } = await setupApprovedDeveloper({
    adminEmail: ADMIN_EMAIL,
    devEmail: DEV_EMAIL,
    adminUsername: `j3admin_${ts}`,
    devUsername: `j3dev_${ts}`,
    workspaceName: `Journey3 WS ${ts}`,
    password: PASSWORD,
  })

  await seedTask({
    workspaceId: workspace.id,
    developerId: devUser.id,
    title: 'Journey 3 XP Task',
    difficulty: 'medium',
    xpReward: 40,
  })

  await seedReward({
    workspaceId: workspace.id,
    title: 'Expiring Gift Card',
    coinCost: 4,
    couponCode: COUPON_CODE,
    expiresAt: expiringSoonDate(),
    createdBy: adminUser.id,
  })

  await page.goto('/login')
  await page.getByPlaceholder('Enter your email').fill(DEV_EMAIL)
  await page.getByPlaceholder('Password').fill(PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByRole('button', { name: /skip for now/i }).click({ timeout: 15000 })
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  await page.goto('/tasks')
  const taskCard = taskCardByTitle(page, 'Journey 3 XP Task')
  await taskCard.getByRole('button', { name: /mark complete/i }).click()

  await page.goto('/rewards')
  await expect(page.getByText('Expiring Gift Card')).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: 'Buy' }).first().click()
  await page.getByRole('button', { name: /confirm|purchase/i }).click()

  await page.goto('/profile')
  await expect(page.getByText('Expiring Gift Card')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Expiring soon')).toBeVisible({ timeout: 10000 })

  await page.getByRole('button', { name: /Remove from My Rewards/i }).click()
  await page.getByRole('button', { name: /Confirm remove/i }).click()

  await expect(page.getByText('Expiring Gift Card')).not.toBeVisible({ timeout: 10000 })
})
