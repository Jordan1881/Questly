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
      include: ['src/**/*.{js,jsx}'],
      // Vitest 4 AST-based V8 coverage counts branches more strictly than v3.
      // Floor sits a few points under current (86/75/88/87) to catch
      // regressions without being brittle.
      thresholds: {
        lines: 82,
        functions: 82,
        branches: 70,
        statements: 82,
      },
      exclude: [
        'node_modules/',
        'src/tests/',
        '*.config.*',
        'src/main.jsx',
        'src/App.jsx',
        'src/router/**',
        'src/design-system/**',
        'src/**/*.test.{js,jsx}',
        // Page shells and the Jira integration console are exercised by the
        // Playwright E2E suite (e2e/**), not unit tests — keep unit coverage
        // focused on components, hooks, lib, overlays, and stores.
        'src/pages/**',
        'src/components/JiraSyncTab.jsx',
      ],
    },
  },
})
