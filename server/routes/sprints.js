const { Router } = require('express')
const verifyToken = require('../middleware/verifyToken')
const requireRoleUnlessMultiWorkspace = require('../middleware/requireRoleUnlessMultiWorkspace')
const { updateSprint, closeSprint } = require('../controllers/sprints')

const router = Router()

router.patch('/:id', verifyToken, requireRoleUnlessMultiWorkspace('admin'), updateSprint)
router.post('/:id/close', verifyToken, requireRoleUnlessMultiWorkspace('admin'), closeSprint)

module.exports = router
