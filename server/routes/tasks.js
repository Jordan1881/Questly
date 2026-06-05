const { Router } = require('express')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const { listMine, sync, updateCompletion } = require('../controllers/tasks')

const router = Router()

router.get('/', verifyToken, requireRole('developer'), listMine)
router.post('/sync/:workspaceId', verifyToken, requireRole('admin'), sync)
router.patch('/:id/completion', verifyToken, requireRole('developer'), updateCompletion)

module.exports = router
