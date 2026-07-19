const { Router } = require('express')
const { register, login, me, logout, connectJira, disconnectJira, changePassword } = require('../controllers/auth')
const {
  oauthStatus,
  oauthStart,
  oauthCallback,
  getPending,
  cancelPending,
  listPendingSites,
  confirmPendingSite,
} = require('../controllers/jiraOAuth')
const verifyToken = require('../middleware/verifyToken')
const { loginLimiter, registerLimiter, jiraConnectLimiter } = require('../middleware/rateLimit')
const { validateBody } = require('../middleware/validate')
const { loginSchema } = require('../validation/schemas')

const router = Router()

router.post('/register', registerLimiter, register)
router.post('/login', loginLimiter, validateBody(loginSchema), login)
router.get('/me', verifyToken, me)
router.get('/jira/oauth/status', verifyToken, oauthStatus)
router.get('/jira/oauth/start', verifyToken, oauthStart)
router.get('/jira/oauth/callback', oauthCallback)
router.get('/jira/oauth/pending', verifyToken, getPending)
router.delete('/jira/oauth/pending', verifyToken, cancelPending)
router.get('/jira/oauth/pending/sites', verifyToken, listPendingSites)
router.post('/jira/oauth/pending/site', verifyToken, confirmPendingSite)
router.post('/me/jira/connect', verifyToken, jiraConnectLimiter, connectJira)
router.delete('/me/jira/disconnect', verifyToken, disconnectJira)
router.post('/logout', verifyToken, logout)
router.post('/change-password', verifyToken, changePassword)

module.exports = router
