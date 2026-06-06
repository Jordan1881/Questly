const { Router } = require('express')
const { register, login, me, logout, connectJira, disconnectJira } = require('../controllers/auth')
const verifyToken = require('../middleware/verifyToken')

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', verifyToken, me)
router.post('/me/jira/connect', verifyToken, connectJira)
router.delete('/me/jira/disconnect', verifyToken, disconnectJira)
router.post('/logout', verifyToken, logout)

module.exports = router
