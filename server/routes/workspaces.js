const { Router } = require('express')
const {
  create,
  getById,
  update,
  getByCode,
  getMine,
  listMembers,
  connectJira,
  disconnectJira,
} = require('../controllers/workspace')
const {
  submit,
  listPending,
  review,
} = require('../controllers/joinRequest')
const { listByWorkspace } = require('../controllers/tasks')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')

const router = Router()

router.post('/', verifyToken, requireRole('admin'), create)
router.get('/mine', verifyToken, requireRole('admin'), getMine)
router.get('/by-code/:code', verifyToken, getByCode)
router.get('/:id/members', verifyToken, requireRole('admin'), listMembers)
router.get('/:id/tasks', verifyToken, requireRole('admin'), listByWorkspace)
router.get('/:id/join-requests', verifyToken, requireRole('admin'), listPending)
router.post('/:id/join-requests', verifyToken, requireRole('developer'), submit)
router.patch('/:id/join-requests/:requestId', verifyToken, requireRole('admin'), review)
router.post('/:id/jira/connect', verifyToken, requireRole('admin'), connectJira)
router.delete('/:id/jira/disconnect', verifyToken, requireRole('admin'), disconnectJira)
router.get('/:id', verifyToken, getById)
router.patch('/:id', verifyToken, requireRole('admin'), update)

module.exports = router
