const { Router } = require('express')
const { create, getById, update } = require('../controllers/workspace')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')

const router = Router()

router.post('/', verifyToken, requireRole('admin'), create)
router.get('/:id', verifyToken, getById)
router.patch('/:id', verifyToken, requireRole('admin'), update)

module.exports = router
