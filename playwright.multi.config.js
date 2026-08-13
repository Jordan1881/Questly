import { defineConfig } from '@playwright/test'

/** E2E config for MULTI_WORKSPACE=true journeys (see docs/MULTI_WORKSPACE.md). */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/multi-workspace.spec.js',
  timeout: 90000,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'node --require dotenv/config index.js',
      cwd: './server',
      port: 3001,
      reuseExistingServer: false,
      timeout: 15000,
      env: {
        E2E_SEED_ENABLED: 'true',
        MULTI_WORKSPACE: 'true',
        RATE_LIMIT_LOGIN_MAX: '1000',
        RATE_LIMIT_REGISTER_MAX: '1000',
        RATE_LIMIT_JIRA_CONNECT_MAX: '1000',
      },
    },
    {
      command: 'npm run build && npx serve -s dist -l 5173',
      port: 5173,
      reuseExistingServer: true,
      timeout: 120000,
      env: { VITE_API_URL: 'http://localhost:3001' },
    },
  ],
})
