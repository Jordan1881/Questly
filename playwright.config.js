import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'node --require dotenv/config server/index.js',
      port: 3001,
      reuseExistingServer: true,
      timeout: 10000,
      env: { DOTENV_CONFIG_PATH: 'server/.env', E2E_SEED_ENABLED: 'true' },
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
