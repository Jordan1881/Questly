const { Router } = require('express')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const requireRoleUnlessMultiWorkspace = require('../middleware/requireRoleUnlessMultiWorkspace')
const requireWorkspaceContext = require('../middleware/requireWorkspaceContext')
const { listMine, sync, updateCompletion, getById } = require('../controllers/tasks')

const router = Router()

router.get(
  '/',
  verifyToken,
  requireRoleUnlessMultiWorkspace('developer'),
  requireWorkspaceContext,
  listMine
)
router.post('/sync/:workspaceId', verifyToken, requireRole('admin'), sync)
router.get('/:id', verifyToken, getById)
router.patch(
  '/:id/completion',
  verifyToken,
  requireRoleUnlessMultiWorkspace('developer'),
  requireWorkspaceContext,
  updateCompletion
)

module.exports = router
