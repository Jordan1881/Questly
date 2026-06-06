import { test, expect } from '@playwright/test'

const ts = Date.now()
const DEV_EMAIL = `dev_${ts}@e2e.test`
const ADMIN_EMAIL = `admin_${ts}@e2e.test`
const PASSWORD = 'Password123!'

// ── Hero page ─────────────────────────────────────────────────────────────────

test('hero page loads and shows sign-in / sign-up buttons', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
})

// ── Sign-up page structure ────────────────────────────────────────────────────

test('sign-up page renders role toggle and form fields', async ({ page }) => {
  await page.goto('/signup')
  await expect(page.getByText('Developer').first()).toBeVisible()
  await expect(page.getByText('Admin').first()).toBeVisible()
  await expect(page.getByPlaceholder('Enter your email')).toBeVisible()
  await expect(page.getByPlaceholder('Create a username')).toBeVisible()
  await expect(page.getByPlaceholder('Create a password')).toBeVisible()
  await expect(page.getByPlaceholder('Re-enter your password')).toBeVisible()
})

// ── Sign-in error state ───────────────────────────────────────────────────────

test('sign-in shows error banner on wrong credentials', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Enter email or user name').fill('nobody@nowhere.com')
  await page.getByPlaceholder('Password').fill('wrongpassword')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.getByText('Invalid credentials')).toBeVisible({ timeout: 8000 })
})

// ── Password mismatch validation ──────────────────────────────────────────────

test('sign-up shows validation error when passwords do not match', async ({ page }) => {
  await page.goto('/signup')
  await page.getByPlaceholder('Enter your email').fill(`mismatch_${ts}@e2e.test`)
  await page.getByPlaceholder('Create a username').fill(`mismatch_${ts}`)
  await page.getByPlaceholder('Create a password').fill('Password123!')
  await page.getByPlaceholder('Re-enter your password').fill('Different999!')
  await page.getByRole('button', { name: /create account/i }).click()
  await expect(page.getByText('Passwords do not match')).toBeVisible()
})

// ── Developer sign-up golden path ─────────────────────────────────────────────

test('developer can sign up and reach the Jira connect screen', async ({ page }) => {
  await page.goto('/signup')
  await page.getByText('Developer').first().click()
  await page.getByPlaceholder('Enter your email').fill(DEV_EMAIL)
  await page.getByPlaceholder('Create a username').fill(`dev_${ts}`)
  await page.getByPlaceholder('Create a password').fill(PASSWORD)
  await page.getByPlaceholder('Re-enter your password').fill(PASSWORD)
  await page.getByRole('button', { name: /create account/i }).click()
  await expect(page.getByText(/connect.*jira|jira.*connect/i).first()).toBeVisible({ timeout: 8000 })
})

// ── Admin sign-up golden path ─────────────────────────────────────────────────

test('admin can sign up and reach workspace create (Jira connect is developer-only)', async ({ page }) => {
  await page.goto('/signup')
  await page.getByText('Admin').first().click()
  await page.getByPlaceholder('Enter your email').fill(ADMIN_EMAIL)
  await page.getByPlaceholder('Create a username').fill(`admin_${ts}`)
  await page.getByPlaceholder('Create a password').fill(PASSWORD)
  await page.getByPlaceholder('Re-enter your password').fill(PASSWORD)
  await page.getByRole('button', { name: /create account/i }).click()
  await expect(page).toHaveURL(/\/workspace\/create/, { timeout: 8000 })
})

// ── Duplicate email error ─────────────────────────────────────────────────────

test('sign-up shows error when email is already registered', async ({ page }) => {
  const fillSignup = async (email, username) => {
    await page.goto('/signup')
    await page.getByPlaceholder('Enter your email').fill(email)
    await page.getByPlaceholder('Create a username').fill(username)
    await page.getByPlaceholder('Create a password').fill(PASSWORD)
    await page.getByPlaceholder('Re-enter your password').fill(PASSWORD)
    await page.getByRole('button', { name: /create account/i }).click()
  }

  await fillSignup(DEV_EMAIL, `dev_${ts}`)
  await page.waitForTimeout(1500)
  await fillSignup(DEV_EMAIL, `dev2_${ts}`)
  await expect(page.getByText('Email already registered')).toBeVisible({ timeout: 8000 })
})
