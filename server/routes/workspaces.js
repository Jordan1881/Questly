const { Router } = require('express')
const { create } = require('../controllers/workspace')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')

const router = Router()

router.post('/', verifyToken, requireRole('admin'), create)

module.exports = router
