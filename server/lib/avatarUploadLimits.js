/**
 * Resolve avatar upload limits for both local monorepo and Railway.
 * Railway Root Directory is `server/` (see DEPLOY.md), so repo-root `shared/`
 * is not on the container filesystem — prefer `server/shared/` first.
 */
const path = require('path')
const fs = require('fs')

const candidates = [
  path.join(__dirname, '..', 'shared', 'avatarUploadLimits.json'),
  path.join(__dirname, '..', '..', 'shared', 'avatarUploadLimits.json'),
]

let limits = null
for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    limits = require(candidate)
    break
  }
}

if (!limits) {
  throw new Error(
    `avatarUploadLimits.json not found (tried: ${candidates.join(', ')})`,
  )
}

module.exports = limits
