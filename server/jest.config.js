module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: false,
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!migrations/**',
    '!seeds/**',
    '!jest.config.js',
    '!knexfile.js',
    '!coverage/**',
  ],
  coverageReporters: ['text', 'json', 'html'],
  passWithNoTests: true,
}
