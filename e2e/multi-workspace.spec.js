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

test('multi-workspace switch lands on role home with shell context', async ({ page }) => {
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

  const openSwitcher = async () => {
    const trigger = page.getByRole('button', { name: /Alpha MW|Beta MW|No workspace/i }).first()
    await expect(trigger).toBeVisible({ timeout: 10000 })
    await trigger.click()
  }

  // Switch away then back so we assert a landing, not a no-op on the current workspace.
  await openSwitcher()
  await page.getByRole('option', { name: new RegExp(`Alpha MW ${ts}`) }).click()
  await expect(page).toHaveURL(new RegExp(`/w/${alpha.id}/admin`), { timeout: 15000 })

  await openSwitcher()
  await page.getByRole('option', { name: new RegExp(`Beta MW ${ts}`) }).click()
  await expect(page).toHaveURL(new RegExp(`/w/${beta.id}/admin`), { timeout: 15000 })
  await expect(page.getByRole('navigation', { name: 'Main' }).getByText('Admin')).toBeVisible()
  await expect(page.getByRole('button', { name: new RegExp(`Beta MW ${ts}`) })).toBeVisible()
})
