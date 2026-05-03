import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
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
      env: { DOTENV_CONFIG_PATH: 'server/.env' },
    },
    {
      command: 'npx vite',
      port: 5173,
      reuseExistingServer: true,
      timeout: 15000,
    },
  ],
})
