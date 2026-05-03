const { Router } = require('express')
const { register, login, me, logout } = require('../controllers/auth')
const verifyToken = require('../middleware/verifyToken')

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', verifyToken, me)
router.post('/logout', verifyToken, logout)

module.exports = router
