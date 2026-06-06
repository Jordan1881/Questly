import { test, expect } from '@playwright/test'
import {
  register,
  createWorkspace,
  submitJoinRequest,
  listPendingJoinRequests,
  approveJoinRequest,
  seedTask,
  seedReward,
} from './helpers/api.mjs'

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
  const { token: adminToken, user: adminUser } = await register({
    email: ADMIN_EMAIL,
    username: `j3admin_${ts}`,
    password: PASSWORD,
    role: 'admin',
  })
  const workspace = await createWorkspace(adminToken, `Journey3 WS ${ts}`)

  const { token: devToken, user: devUser } = await register({
    email: DEV_EMAIL,
    username: `j3dev_${ts}`,
    password: PASSWORD,
    role: 'developer',
  })

  const joinRequest = await submitJoinRequest(devToken, workspace.id)
  const pending = await listPendingJoinRequests(adminToken, workspace.id)
  await approveJoinRequest(adminToken, workspace.id, pending[0]?.id || joinRequest.id)

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
    xpCost: 40,
    couponCode: COUPON_CODE,
    expiresAt: expiringSoonDate(),
    createdBy: adminUser.id,
  })

  await page.goto('/login')
  await page.getByPlaceholder('Enter email or user name').fill(DEV_EMAIL)
  await page.getByPlaceholder('Password').fill(PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByRole('button', { name: /skip for now/i }).click({ timeout: 15000 })
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  await page.goto('/tasks')
  const taskCard = page.locator('text=Journey 3 XP Task').locator('xpath=ancestor::div[contains(@class,"rounded")]').first()
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
