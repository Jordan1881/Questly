const { Router } = require('express')
const { register, login, me, logout, connectJira, disconnectJira } = require('../controllers/auth')
const { oauthStatus, oauthStart, oauthCallback } = require('../controllers/jiraOAuth')
const verifyToken = require('../middleware/verifyToken')

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', verifyToken, me)
router.get('/jira/oauth/status', verifyToken, oauthStatus)
router.get('/jira/oauth/start', verifyToken, oauthStart)
router.get('/jira/oauth/callback', oauthCallback)
router.post('/me/jira/connect', verifyToken, connectJira)
router.delete('/me/jira/disconnect', verifyToken, disconnectJira)
router.post('/logout', verifyToken, logout)

module.exports = router
