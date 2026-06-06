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
const ADMIN_EMAIL = `j2_admin_${ts}@e2e.test`
const DEV_EMAIL = `j2_dev_${ts}@e2e.test`
const COUPON_CODE = `E2E-COUPON-${ts}`
const EXPIRES_AT = '2026-12-31'

test('Journey 2 — earn XP, purchase reward, coupon in My Rewards', async ({ page }) => {
  const { token: adminToken, user: adminUser } = await register({
    email: ADMIN_EMAIL,
    username: `j2admin_${ts}`,
    password: PASSWORD,
    role: 'admin',
  })
  const workspace = await createWorkspace(adminToken, `Journey2 WS ${ts}`)

  const { token: devToken, user: devUser } = await register({
    email: DEV_EMAIL,
    username: `j2dev_${ts}`,
    password: PASSWORD,
    role: 'developer',
  })

  const joinRequest = await submitJoinRequest(devToken, workspace.id)
  const pending = await listPendingJoinRequests(adminToken, workspace.id)
  await approveJoinRequest(adminToken, workspace.id, pending[0]?.id || joinRequest.id)

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
    xpCost: 40,
    couponCode: COUPON_CODE,
    expiresAt: EXPIRES_AT,
    createdBy: adminUser.id,
  })

  await page.goto('/login')
  await page.getByPlaceholder('Enter email or user name').fill(DEV_EMAIL)
  await page.getByPlaceholder('Password').fill(PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByRole('button', { name: /skip for now/i }).click({ timeout: 15000 })
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  await page.goto('/tasks')
  await expect(page.getByText('Earn XP Task')).toBeVisible({ timeout: 15000 })
  const taskCard = page.locator('text=Earn XP Task').locator('xpath=ancestor::div[contains(@class,"rounded")]').first()
  await taskCard.getByRole('button', { name: /mark complete/i }).click()

  await page.goto('/rewards')
  await expect(page.getByText('E2E Gift Card')).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: 'Buy' }).first().click()
  await page.getByRole('button', { name: /confirm|purchase/i }).click()

  await page.goto('/profile')
  await expect(page.getByText('E2E Gift Card')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/Dec 31, 2026|2026/)).toBeVisible({ timeout: 10000 })
})
