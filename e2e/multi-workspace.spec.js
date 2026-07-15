import { test, expect } from '@playwright/test'
import { api, createWorkspace, register } from './helpers/api.mjs'

const ts = Date.now()
const PASSWORD = 'Password123!'

async function multiWorkspaceEnabled(token) {
  try {
    await api('/api/workspaces/memberships', { token })
    return true
  } catch {
    return false
  }
}

test('multi-workspace switch via Workspace tab lands on role home', async ({ page }) => {
  const email = `mw_owner_${ts}@e2e.test`
  const { token } = await register({
    email,
    username: `mw_owner_${ts}`,
    password: PASSWORD,
    role: 'admin',
  })

  test.skip(!(await multiWorkspaceEnabled(token)), 'MULTI_WORKSPACE is off on the API')

  const alpha = await createWorkspace(token, `Alpha MW ${ts}`)
  const beta = await createWorkspace(token, `Beta MW ${ts}`)

  await page.goto('/login')
  await page.getByPlaceholder('Enter your email').fill(email)
  await page.getByPlaceholder('Password').fill(PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()

  // Optional Jira overlay is developer-oriented; dismiss if present.
  const skip = page.getByRole('button', { name: /skip for now/i })
  if (await skip.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skip.click()
  }

  await expect(page).toHaveURL(new RegExp(`/w/${alpha.id}/admin|/w/${beta.id}/admin|/admin`), {
    timeout: 15000,
  })

  const openWorkspaceTab = async () => {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Workspace' }).click()
    await expect(page).toHaveURL(/\/workspace/, { timeout: 10000 })
    await expect(page.getByTestId('workspace-switch-list')).toBeVisible()
  }

  await openWorkspaceTab()
  await page.getByRole('button', { name: new RegExp(`Alpha MW ${ts}`) }).click()
  await expect(page).toHaveURL(new RegExp(`/w/${alpha.id}/admin`), { timeout: 15000 })

  await openWorkspaceTab()
  await page.getByRole('button', { name: new RegExp(`Beta MW ${ts}`) }).click()
  await expect(page).toHaveURL(new RegExp(`/w/${beta.id}/admin`), { timeout: 15000 })
  await expect(page.getByRole('navigation', { name: 'Main' }).getByText('Admin')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main' }).getByText('Workspace')).toBeVisible()
})
