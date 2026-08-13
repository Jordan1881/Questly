const path = require('path')
const fs = require('fs')
const limits = require('../lib/avatarUploadLimits')

describe('avatarUploadLimits', () => {
  test('loads limits usable under Railway-style server root', () => {
    expect(limits.maxBytes).toBe(2097152)
    expect(limits.maxMbLabel).toBe('2 MB')
    expect(limits.minSourcePx).toBe(400)
    expect(limits.allowedMime).toEqual(
      expect.arrayContaining(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    )
  })

  test('server/shared copy matches repo-root shared (when present)', () => {
    const rootShared = path.join(__dirname, '..', '..', 'shared', 'avatarUploadLimits.json')
    const serverShared = path.join(__dirname, '..', 'shared', 'avatarUploadLimits.json')
    expect(fs.existsSync(serverShared)).toBe(true)
    if (fs.existsSync(rootShared)) {
      expect(JSON.parse(fs.readFileSync(serverShared, 'utf8'))).toEqual(
        JSON.parse(fs.readFileSync(rootShared, 'utf8')),
      )
    }
  })
})
