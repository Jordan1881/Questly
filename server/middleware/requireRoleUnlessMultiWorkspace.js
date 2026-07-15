const requireRole = require('./requireRole')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')

/**
 * When MULTI_WORKSPACE is on, skip global users.role checks so role-less
 * accounts can create/join; membership auth takes over in later tickets.
 * When off, same as requireRole(...roles).
 */
function requireRoleUnlessMultiWorkspace(...roles) {
  const legacy = requireRole(...roles)
  return (req, res, next) => {
    if (isMultiWorkspaceEnabled()) return next()
    return legacy(req, res, next)
  }
}

module.exports = requireRoleUnlessMultiWorkspace
