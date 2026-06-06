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
const workspaceJiraOAuth = require('../controllers/workspaceJiraOAuth')
const {
  submit,
  listPending,
  review,
} = require('../controllers/joinRequest')
const { listByWorkspace } = require('../controllers/tasks')
const {
  createForWorkspace,
  listForWorkspace,
  getActiveForWorkspace,
} = require('../controllers/sprints')
const { createForWorkspace: createReward, listForWorkspace: listRewards } = require('../controllers/rewards')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')

const router = Router()

router.post('/', verifyToken, requireRole('admin'), create)
router.get('/mine', verifyToken, requireRole('admin'), getMine)
router.get('/jira/oauth/status', verifyToken, requireRole('admin'), workspaceJiraOAuth.oauthStatus)
router.get('/jira/oauth/callback', workspaceJiraOAuth.oauthCallback)
router.get('/by-code/:code', verifyToken, getByCode)
router.get('/:id/members', verifyToken, requireRole('admin'), listMembers)
router.get('/:id/tasks', verifyToken, requireRole('admin'), listByWorkspace)
router.post('/:id/sprints', verifyToken, requireRole('admin'), createForWorkspace)
router.get('/:id/sprints/active', verifyToken, getActiveForWorkspace)
router.get('/:id/sprints', verifyToken, listForWorkspace)
router.post('/:id/rewards', verifyToken, requireRole('admin'), createReward)
router.get('/:id/rewards', verifyToken, listRewards)
router.get('/:id/join-requests', verifyToken, requireRole('admin'), listPending)
router.post('/:id/join-requests', verifyToken, requireRole('developer'), submit)
router.patch('/:id/join-requests/:requestId', verifyToken, requireRole('admin'), review)
router.get('/:id/jira/oauth/start', verifyToken, requireRole('admin'), workspaceJiraOAuth.oauthStart)
router.post('/:id/jira/connect', verifyToken, requireRole('admin'), connectJira)
router.delete('/:id/jira/disconnect', verifyToken, requireRole('admin'), disconnectJira)
router.get('/:id', verifyToken, getById)
router.patch('/:id', verifyToken, requireRole('admin'), update)

module.exports = router
