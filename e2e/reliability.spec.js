import { test, expect } from '@playwright/test'
import {
  setupApprovedDeveloper,
  seedTask,
  seedReward,
  signInViaUi,
  taskCardByTitle,
} from './helpers/api.mjs'

const PASSWORD = 'Password123!'

async function signInDeveloper(page, { email, password }) {
  await signInViaUi(page, { email, password, skipJira: true })
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
}

test.describe('Reliability — API failure mid-journey', () => {
  test('completing a quest while the API is down shows an error toast and rolls back', async ({
    page,
  }) => {
    const ts = Date.now()
    const { devUser, workspace } = await setupApprovedDeveloper({
      adminEmail: `rel_admin_${ts}@e2e.test`,
      devEmail: `rel_dev_${ts}@e2e.test`,
      adminUsername: `reladmin_${ts}`,
      devUsername: `reldev_${ts}`,
      workspaceName: `Reliability WS ${ts}`,
      password: PASSWORD,
    })

    await seedTask({
      workspaceId: workspace.id,
      developerId: devUser.id,
      title: 'Reliability Complete Task',
      difficulty: 'medium',
      xpReward: 40,
    })

    await signInDeveloper(page, { email: `rel_dev_${ts}@e2e.test`, password: PASSWORD })
    await page.goto('/tasks')
    await expect(page.getByText('Reliability Complete Task')).toBeVisible({ timeout: 15000 })

    await page.route('**/api/tasks/*/completion', (route) => route.abort('failed'))

    const taskCard = taskCardByTitle(page, 'Reliability Complete Task')
    await taskCard.getByRole('button', { name: /mark complete/i }).click()

    await expect(page.getByRole('alert')).toContainText(/network error/i, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Task List' })).toBeVisible()
    await expect(taskCard.getByRole('button', { name: /mark complete/i })).toBeVisible()
    await expect(taskCard.getByRole('button', { name: /mark incomplete/i })).toHaveCount(0)
  })

  test('task list stays usable when the task fetch fails', async ({ page }) => {
    const ts = Date.now()
    await setupApprovedDeveloper({
      adminEmail: `rel2_admin_${ts}@e2e.test`,
      devEmail: `rel2_dev_${ts}@e2e.test`,
      adminUsername: `rel2admin_${ts}`,
      devUsername: `rel2dev_${ts}`,
      workspaceName: `Reliability Fetch WS ${ts}`,
      password: PASSWORD,
    })

    await signInDeveloper(page, { email: `rel2_dev_${ts}@e2e.test`, password: PASSWORD })

    await page.route('**/api/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.abort('failed')
        return
      }
      await route.continue()
    })

    await page.goto('/tasks')

    await expect(page.getByRole('heading', { name: 'Task List' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Tasks unavailable')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('alert')).toContainText(/network error/i, { timeout: 10000 })
  })

  test('after the API recovers, completing a quest works again', async ({ page }) => {
    const ts = Date.now()
    const { devUser, workspace } = await setupApprovedDeveloper({
      adminEmail: `rel3_admin_${ts}@e2e.test`,
      devEmail: `rel3_dev_${ts}@e2e.test`,
      adminUsername: `rel3admin_${ts}`,
      devUsername: `rel3dev_${ts}`,
      workspaceName: `Reliability Recover WS ${ts}`,
      password: PASSWORD,
    })

    await seedTask({
      workspaceId: workspace.id,
      developerId: devUser.id,
      title: 'Reliability Recover Task',
      difficulty: 'easy',
      xpReward: 20,
    })

    await signInDeveloper(page, { email: `rel3_dev_${ts}@e2e.test`, password: PASSWORD })
    await page.goto('/tasks')
    await expect(page.getByText('Reliability Recover Task')).toBeVisible({ timeout: 15000 })

    let blockCompletion = true
    await page.route('**/api/tasks/*/completion', async (route) => {
      if (blockCompletion) {
        await route.abort('failed')
        return
      }
      await route.continue()
    })

    const taskCard = taskCardByTitle(page, 'Reliability Recover Task')
    await taskCard.getByRole('button', { name: /mark complete/i }).click()
    await expect(page.getByRole('alert')).toContainText(/network error/i, { timeout: 10000 })
    await expect(taskCard.getByRole('button', { name: /mark complete/i })).toBeVisible()

    blockCompletion = false
    await taskCard.getByRole('button', { name: /mark complete/i }).click()

    await expect(page.getByRole('status')).toContainText(/\+20 XP/i, { timeout: 10000 })
    await expect(taskCard.getByRole('button', { name: /mark incomplete/i })).toBeVisible({
      timeout: 10000,
    })
  })

  test('server 500 on purchase shows an error toast instead of a blank crash', async ({ page }) => {
    const ts = Date.now()
    const { adminUser, devUser, workspace } = await setupApprovedDeveloper({
      adminEmail: `rel4_admin_${ts}@e2e.test`,
      devEmail: `rel4_dev_${ts}@e2e.test`,
      adminUsername: `rel4admin_${ts}`,
      devUsername: `rel4dev_${ts}`,
      workspaceName: `Reliability Shop WS ${ts}`,
      password: PASSWORD,
    })

    await seedTask({
      workspaceId: workspace.id,
      developerId: devUser.id,
      title: 'Shop Seed Task',
      difficulty: 'medium',
      xpReward: 40,
    })

    // Give the developer coins via a completed task first (API up).
    await signInDeveloper(page, { email: `rel4_dev_${ts}@e2e.test`, password: PASSWORD })
    await page.goto('/tasks')
    await expect(page.getByText('Shop Seed Task')).toBeVisible({ timeout: 15000 })
    await taskCardByTitle(page, 'Shop Seed Task')
      .getByRole('button', { name: /mark complete/i })
      .click()
    await expect(page.getByRole('status')).toContainText(/\+40 XP/i, { timeout: 10000 })

    // Seed reward after XP so the shop has something to buy.
    await seedReward({
      workspaceId: workspace.id,
      title: 'Broken Purchase Reward',
      coinCost: 1,
      couponCode: `REL-COUPON-${ts}`,
      expiresAt: '2026-12-31',
      createdBy: adminUser.id,
    })

    await page.route('**/api/rewards/*/purchase', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Simulated purchase failure' }),
      })
    })

    await page.goto('/rewards')
    await expect(page.getByText('Broken Purchase Reward')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Buy' }).first().click()
    await page.getByRole('button', { name: /confirm|purchase/i }).click()

    await expect(page.getByRole('alert')).toContainText(/simulated purchase failure|something went wrong/i, {
      timeout: 10000,
    })
    await expect(page.getByRole('heading', { name: 'Reward Shop' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Broken Purchase Reward' })).toBeVisible()
  })
})