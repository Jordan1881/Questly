const { Router } = require('express')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const { xpHistory, dashboard } = require('../controllers/users')

const router = Router()

router.get('/me/xp-history', verifyToken, requireRole('developer'), xpHistory)
router.get('/me/dashboard', verifyToken, requireRole('developer'), dashboard)

module.exports = router
