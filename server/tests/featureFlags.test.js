const { isMultiWorkspaceEnabled, envFlagEnabled } = require('../lib/featureFlags')

describe('featureFlags', () => {
  const prev = process.env.MULTI_WORKSPACE

  afterEach(() => {
    if (prev === undefined) delete process.env.MULTI_WORKSPACE
    else process.env.MULTI_WORKSPACE = prev
  })

  test('MULTI_WORKSPACE defaults off when unset', () => {
    delete process.env.MULTI_WORKSPACE
    expect(isMultiWorkspaceEnabled()).toBe(false)
  })

  test('MULTI_WORKSPACE accepts common truthy values', () => {
    process.env.MULTI_WORKSPACE = 'true'
    expect(isMultiWorkspaceEnabled()).toBe(true)
    process.env.MULTI_WORKSPACE = '1'
    expect(isMultiWorkspaceEnabled()).toBe(true)
    process.env.MULTI_WORKSPACE = 'false'
    expect(isMultiWorkspaceEnabled()).toBe(false)
  })

  test('envFlagEnabled treats empty as false', () => {
    expect(envFlagEnabled('')).toBe(false)
    expect(envFlagEnabled(null)).toBe(false)
    expect(envFlagEnabled('on')).toBe(true)
  })
})
