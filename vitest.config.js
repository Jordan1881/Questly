import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    exclude: ['node_modules/**', 'e2e/**', 'server/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/stores/**/*.js'],
      // Vitest 4 AST-based V8 coverage counts branches more strictly than v3.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 55,
        statements: 80,
      },
      exclude: ['node_modules/', 'src/tests/', '*.config.*'],
    },
  },
})
