const { Router } = require('express')
const { getMine } = require('../controllers/joinRequest')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')

const router = Router()

router.get('/me', verifyToken, requireRole('developer'), getMine)

module.exports = router
