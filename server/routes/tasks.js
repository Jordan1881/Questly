const { Router } = require('express')
const verifyToken = require('../middleware/verifyToken')
const requireRoleUnlessMultiWorkspace = require('../middleware/requireRoleUnlessMultiWorkspace')
const requireWorkspaceContext = require('../middleware/requireWorkspaceContext')
const { validateBody } = require('../middleware/validate')
const { taskCompletionSchema } = require('../validation/schemas')
const { listMine, sync, updateCompletion, getById } = require('../controllers/tasks')

const router = Router()

router.get(
  '/',
  verifyToken,
  requireRoleUnlessMultiWorkspace('developer'),
  requireWorkspaceContext,
  listMine
)
router.post('/sync/:workspaceId', verifyToken, requireRoleUnlessMultiWorkspace('admin'), sync)
router.get('/:id', verifyToken, getById)
router.patch(
  '/:id/completion',
  verifyToken,
  requireRoleUnlessMultiWorkspace('developer'),
  requireWorkspaceContext,
  validateBody(taskCompletionSchema),
  updateCompletion
)

module.exports = router
