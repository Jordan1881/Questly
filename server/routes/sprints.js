const { Router } = require('express')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const { updateSprint, closeSprint } = require('../controllers/sprints')

const router = Router()

router.patch('/:id', verifyToken, requireRole('admin'), updateSprint)
router.post('/:id/close', verifyToken, requireRole('admin'), closeSprint)

module.exports = router
