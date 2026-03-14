import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/stores/**/*.js'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      exclude: ['node_modules/', 'src/tests/', '*.config.*'],
    },
  },
})
