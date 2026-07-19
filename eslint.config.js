import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'server/coverage',
    'playwright-report',
    'test-results',
  ]),

  // Frontend app code: browser + JSX, ES modules, React fast-refresh rules.
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Fast-refresh / effect advisories: keep as warnings so `npm run lint`
      // stays a clean pass. These flag HMR ergonomics and fetch-on-mount
      // patterns, not correctness bugs.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  // The router module legitimately defines lazy route components and exports the
  // router object — it is never fast-refreshed, so silence that HMR advisory here.
  {
    files: ['src/router/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Frontend tests run under Vitest (globals: true) in a jsdom environment on
  // Node, so both browser and node globals are in scope.
  {
    files: ['src/tests/**/*.{js,jsx}', 'src/**/*.{test,spec}.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
  },

  // Backend API: Node + CommonJS.
  {
    files: ['server/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^[A-Z_]',
          argsIgnorePattern: '^_|^next$',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Backend tests run under Jest.
  {
    files: ['server/tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },

  // CommonJS scripts (Node) — repo tooling.
  {
    files: ['scripts/**/*.cjs', 'server/**/*.cjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },

  // Root ES module tooling configs (Vite, Vitest, Playwright, ESLint).
  {
    files: ['*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // Playwright end-to-end specs: Node + ES modules.
  {
    files: ['e2e/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
  },
])
