import { defineConfig } from '@playwright/test'

/** Run against already-running API (:3001) and frontend (:5173). */
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
})
