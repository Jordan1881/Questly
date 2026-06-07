const rateLimit = require('express-rate-limit')

function skipInTest(limiter) {
  if (process.env.NODE_ENV === 'test' || process.env.E2E_SEED_ENABLED === 'true') {
    return (_req, _res, next) => next()
  }
  return limiter
}

const jsonError = (message) => ({ error: message })

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonError('Too many login attempts. Try again in 15 minutes.'),
})

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_REGISTER_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonError('Too many sign-up attempts. Try again in an hour.'),
})

const jiraConnectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_JIRA_CONNECT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonError('Too many Jira connect attempts. Try again later.'),
})

module.exports = {
  loginLimiter: skipInTest(loginLimiter),
  registerLimiter: skipInTest(registerLimiter),
  jiraConnectLimiter: skipInTest(jiraConnectLimiter),
}
