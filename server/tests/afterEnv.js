const nock = require('nock')

// Nock v14 stacks interceptors across Jest test files unless restored between files.
afterAll(() => {
  nock.cleanAll()
  nock.restore()
})
