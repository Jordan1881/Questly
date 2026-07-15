import { test, expect } from '@playwright/test'
import { register, createWorkspace, seedWorkspaceJira, SIGN_IN_EMAIL_PLACEHOLDER } from './helpers/api.mjs'

const PASSWORD = 'Password123!'

function uniqueEmails(label) {
  const ts = Date.now()
  return {
    ts,
    devEmail: `${label}_dev_${ts}@e2e.test`,
    adminEmail: `${label}_admin_${ts}@e2e.test`,
  }
}

async function signInDeveloper(page, { email, password = PASSWORD }) {
  await page.goto('/login')
  await page.getByPlaceholder(SIGN_IN_EMAIL_PLACEHOLDER).fill(email)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.getByRole('button', { name: /skip for now/i }).click({ timeout: 15000 })
}

test('developer without workspace is routed to workspace join after sign-in', async ({ page }) => {
  const { ts, devEmail } = uniqueEmails('route')

  await register({
    email: devEmail,
    username: `route_${ts}`,
    password: PASSWORD,
    role: 'developer',
  })

  await signInDeveloper(page, { email: devEmail })

  await expect(page).toHaveURL(/\/workspace\/join/, { timeout: 15000 })
  await expect(page.getByText('Join a Workspace')).toBeVisible()
  await expect(page.getByPlaceholder('WORKSPACE CODE')).toBeVisible()
})

test('pre-workspace developer sees empty states on dashboard and tasks', async ({ page }) => {
  const { ts, devEmail } = uniqueEmails('empty')

  await register({
    email: devEmail,
    username: `empty_${ts}`,
    password: PASSWORD,
    role: 'developer',
  })

  await signInDeveloper(page, { email: devEmail })
  await expect(page).toHaveURL(/\/workspace\/join/, { timeout: 15000 })

  await page.goto('/dashboard')
  await expect(page.getByText('Join a team to get started')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/connect your Jira account on Profile/i)).toBeVisible()

  await page.goto('/tasks')
  await expect(page.getByText('Join a team to see your quests')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/Ask your admin for a join code/i)).toBeVisible()
})

test('developer can submit a workspace join request via UI code lookup', async ({ page }) => {
  const { ts, devEmail, adminEmail } = uniqueEmails('joinui')

  const { token: adminToken } = await register({
    email: adminEmail,
    username: `joinui_admin_${ts}`,
    password: PASSWORD,
    role: 'admin',
  })
  const workspace = await createWorkspace(adminToken, `Onboard WS ${ts}`)
  await seedWorkspaceJira({
    workspaceId: workspace.id,
    jira_site_url: 'https://questly-e2e.atlassian.net',
    jira_project_key: 'QUEST',
  })

  await register({
    email: devEmail,
    username: `joinui_dev_${ts}`,
    password: PASSWORD,
    role: 'developer',
  })

  await signInDeveloper(page, { email: devEmail })
  await expect(page).toHaveURL(/\/workspace\/join/, { timeout: 15000 })

  await page.getByPlaceholder('WORKSPACE CODE').fill(workspace.code)
  await page.getByRole('button', { name: /find workspace/i }).click()
  await expect(page.getByText(workspace.name)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('questly-e2e.atlassian.net')).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: /submit request/i }).click()

  await expect(page.getByText('Join Request Pending')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/connect your Jira account on Profile/i)).toBeVisible()
})
