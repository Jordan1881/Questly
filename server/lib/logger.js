const pino = require('pino')

// Redact anything that could leak a credential or PII token from logs. This is
// the single place secrets are stripped, so no request/response logging path
// can accidentally print an Authorization header or a Jira token.
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-workspace-id"]',
  'res.headers["set-cookie"]',
  '*.password',
  '*.password_hash',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.jira_access_token',
  '*.jira_refresh_token',
]

function resolveLevel() {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL
  if (process.env.NODE_ENV === 'test') return 'silent'
  if (process.env.NODE_ENV === 'production') return 'info'
  return 'debug'
}

const logger = pino({
  level: resolveLevel(),
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  base: { service: 'questly-api' },
})

module.exports = logger
module.exports.REDACT_PATHS = REDACT_PATHS
module.exports.resolveLevel = resolveLevel
